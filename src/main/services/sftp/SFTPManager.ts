import { Client, SFTPWrapper } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  FileEntry,
  Transfer,
  TransferProgress,
  TransferStatus,
  FileOperation,
  DirectoryListing,
  FilePermissions,
} from '../../../shared/types/sftp';
import { Logger } from '../../utils/logger';

interface SFTPSession {
  sessionId: string;
  client: Client;
  sftp?: SFTPWrapper;
  currentPath: string;
}

export class SFTPManager extends EventEmitter {
  private logger: Logger;
  private sessions: Map<string, SFTPSession> = new Map();
  private transfers: Map<string, Transfer> = new Map();

  constructor() {
    super();
    this.logger = new Logger('SFTPManager');
  }

  /**
   * Initialize SFTP for an existing SSH session
   */
  async initSFTP(sessionId: string, client: Client): Promise<void> {
    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) {
          this.logger.error(`Failed to init SFTP for session ${sessionId}:`, err);
          reject(err);
          return;
        }

        this.sessions.set(sessionId, {
          sessionId,
          client,
          sftp,
          currentPath: '/home',
        });

        this.logger.info(`SFTP initialized for session ${sessionId}`);
        resolve();
      });
    });
  }

  /**
   * List directory contents
   */
  async listDirectory(sessionId: string, dirPath: string): Promise<DirectoryListing> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    return new Promise((resolve, reject) => {
      session.sftp!.readdir(dirPath, (err, list) => {
        if (err) {
          this.logger.error(`Failed to list directory ${dirPath}:`, err);
          reject(err);
          return;
        }

        const entries: FileEntry[] = list.map((item) => ({
          name: item.filename,
          path: path.posix.join(dirPath, item.filename),
          type: this.getFileType(item.attrs.mode),
          size: item.attrs.size,
          modifyTime: new Date(item.attrs.mtime * 1000),
          accessTime: new Date(item.attrs.atime * 1000),
          permissions: this.parsePermissions(item.attrs.mode),
          owner: item.attrs.uid.toString(),
          group: item.attrs.gid.toString(),
        }));

        resolve({ path: dirPath, entries });
      });
    });
  }

  /**
   * Download file from remote to local
   */
  async downloadFile(
    sessionId: string,
    remotePath: string,
    localPath: string
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    const transferId = uuidv4();
    const filename = path.basename(remotePath);

    // Get file size
    const stat = await this.getFileStats(sessionId, remotePath);

    const transfer: Transfer = {
      id: transferId,
      type: 'download',
      localPath,
      remotePath,
      filename,
      size: stat.size,
      transferred: 0,
      status: 'transferring',
      speed: 0,
      startTime: new Date(),
      priority: 0,
      sessionId,
    };

    this.transfers.set(transferId, transfer);
    this.emit('transfer-started', transfer);

    return new Promise((resolve, reject) => {
      const readStream = session.sftp!.createReadStream(remotePath);
      const writeStream = fs.createWriteStream(localPath);

      let transferred = 0;
      const startTime = Date.now();

      readStream.on('data', (chunk: Buffer) => {
        transferred += chunk.length;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = transferred / elapsed;

        transfer.transferred = transferred;
        transfer.speed = speed;

        const progress: TransferProgress = {
          transferId,
          transferred,
          percentage: (transferred / transfer.size) * 100,
          speed,
          estimatedTimeRemaining: (transfer.size - transferred) / speed,
        };

        this.emit('transfer-progress', progress);
      });

      readStream.on('error', (err) => {
        transfer.status = 'failed';
        transfer.error = err.message;
        transfer.endTime = new Date();
        this.emit('transfer-failed', transfer);
        reject(err);
      });

      writeStream.on('error', (err) => {
        transfer.status = 'failed';
        transfer.error = err.message;
        transfer.endTime = new Date();
        this.emit('transfer-failed', transfer);
        reject(err);
      });

      writeStream.on('finish', () => {
        transfer.status = 'completed';
        transfer.transferred = transfer.size;
        transfer.endTime = new Date();
        this.emit('transfer-completed', transfer);
        resolve(transferId);
      });

      readStream.pipe(writeStream);
    });
  }

  /**
   * Upload file from local to remote
   */
  async uploadFile(
    sessionId: string,
    localPath: string,
    remotePath: string
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    const transferId = uuidv4();
    const filename = path.basename(localPath);
    const stat = fs.statSync(localPath);

    const transfer: Transfer = {
      id: transferId,
      type: 'upload',
      localPath,
      remotePath,
      filename,
      size: stat.size,
      transferred: 0,
      status: 'transferring',
      speed: 0,
      startTime: new Date(),
      priority: 0,
      sessionId,
    };

    this.transfers.set(transferId, transfer);
    this.emit('transfer-started', transfer);

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(localPath);
      const writeStream = session.sftp!.createWriteStream(remotePath);

      let transferred = 0;
      const startTime = Date.now();

      readStream.on('data', (chunk: Buffer) => {
        transferred += chunk.length;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = transferred / elapsed;

        transfer.transferred = transferred;
        transfer.speed = speed;

        const progress: TransferProgress = {
          transferId,
          transferred,
          percentage: (transferred / transfer.size) * 100,
          speed,
          estimatedTimeRemaining: (transfer.size - transferred) / speed,
        };

        this.emit('transfer-progress', progress);
      });

      readStream.on('error', (err) => {
        transfer.status = 'failed';
        transfer.error = err.message;
        transfer.endTime = new Date();
        this.emit('transfer-failed', transfer);
        reject(err);
      });

      writeStream.on('error', (err) => {
        transfer.status = 'failed';
        transfer.error = err.message;
        transfer.endTime = new Date();
        this.emit('transfer-failed', transfer);
        reject(err);
      });

      writeStream.on('close', () => {
        transfer.status = 'completed';
        transfer.transferred = transfer.size;
        transfer.endTime = new Date();
        this.emit('transfer-completed', transfer);
        resolve(transferId);
      });

      readStream.pipe(writeStream);
    });
  }

  /**
   * Upload directory recursively
   */
  async uploadDirectory(
    sessionId: string,
    localPath: string,
    remotePath: string
  ): Promise<string[]> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    const transferIds: string[] = [];

    // Create remote directory if it doesn't exist
    try {
      await this.createDirectory(sessionId, remotePath);
    } catch (err: any) {
      // Directory might already exist, that's ok
      if (err.code !== 4) { // SSH2_FX_FAILURE
        throw err;
      }
    }

    // Read local directory
    const entries = await fs.promises.readdir(localPath, { withFileTypes: true });

    for (const entry of entries) {
      const localEntryPath = path.join(localPath, entry.name);
      const remoteEntryPath = path.posix.join(remotePath, entry.name);

      if (entry.isDirectory()) {
        // Recursively upload subdirectory
        const subTransferIds = await this.uploadDirectory(
          sessionId,
          localEntryPath,
          remoteEntryPath
        );
        transferIds.push(...subTransferIds);
      } else if (entry.isFile()) {
        // Upload file
        const transferId = await this.uploadFile(sessionId, localEntryPath, remoteEntryPath);
        transferIds.push(transferId);
      }
    }

    return transferIds;
  }

  /**
   * Download directory recursively
   */
  async downloadDirectory(
    sessionId: string,
    remotePath: string,
    localPath: string
  ): Promise<string[]> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    const transferIds: string[] = [];

    // Create local directory if it doesn't exist
    await fs.promises.mkdir(localPath, { recursive: true });

    // List remote directory
    const listing = await this.listDirectory(sessionId, remotePath);

    for (const entry of listing.entries) {
      const localEntryPath = path.join(localPath, entry.name);
      const remoteEntryPath = entry.path;

      if (entry.type === 'directory') {
        // Recursively download subdirectory
        const subTransferIds = await this.downloadDirectory(
          sessionId,
          remoteEntryPath,
          localEntryPath
        );
        transferIds.push(...subTransferIds);
      } else if (entry.type === 'file') {
        // Download file
        const transferId = await this.downloadFile(sessionId, remoteEntryPath, localEntryPath);
        transferIds.push(transferId);
      }
    }

    return transferIds;
  }

  /**
   * Create directory
   */
  async createDirectory(sessionId: string, dirPath: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    return new Promise((resolve, reject) => {
      session.sftp!.mkdir(dirPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Delete file
   */
  async deleteFile(sessionId: string, filePath: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    return new Promise((resolve, reject) => {
      session.sftp!.unlink(filePath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Delete directory
   */
  async deleteDirectory(sessionId: string, dirPath: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    return new Promise((resolve, reject) => {
      session.sftp!.rmdir(dirPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Rename file or directory
   */
  async rename(sessionId: string, oldPath: string, newPath: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    return new Promise((resolve, reject) => {
      session.sftp!.rename(oldPath, newPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Change permissions
   */
  async chmod(sessionId: string, filePath: string, mode: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    const modeNum = parseInt(mode, 8);

    return new Promise((resolve, reject) => {
      session.sftp!.chmod(filePath, modeNum, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Get file statistics
   */
  private async getFileStats(sessionId: string, filePath: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session?.sftp) {
      throw new Error('SFTP session not found');
    }

    return new Promise((resolve, reject) => {
      session.sftp!.stat(filePath, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stats);
      });
    });
  }

  /**
   * Get file type from mode
   */
  private getFileType(mode: number): 'file' | 'directory' | 'symlink' | 'special' {
    const S_IFMT = 0o170000;
    const S_IFREG = 0o100000;
    const S_IFDIR = 0o040000;
    const S_IFLNK = 0o120000;

    const type = mode & S_IFMT;
    if (type === S_IFREG) return 'file';
    if (type === S_IFDIR) return 'directory';
    if (type === S_IFLNK) return 'symlink';
    return 'special';
  }

  /**
   * Parse file permissions
   */
  private parsePermissions(mode: number): FilePermissions {
    const octal = (mode & 0o777).toString(8).padStart(3, '0');

    const parseSet = (digit: string) => {
      const val = parseInt(digit, 10);
      return {
        read: (val & 4) !== 0,
        write: (val & 2) !== 0,
        execute: (val & 1) !== 0,
      };
    };

    return {
      user: parseSet(octal[0]),
      group: parseSet(octal[1]),
      others: parseSet(octal[2]),
      mode: octal,
    };
  }

  /**
   * Get all transfers
   */
  getTransfers(): Transfer[] {
    return Array.from(this.transfers.values());
  }

  /**
   * Get transfer by ID
   */
  getTransfer(transferId: string): Transfer | undefined {
    return this.transfers.get(transferId);
  }

  /**
   * Close SFTP session
   */
  closeSFTP(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session?.sftp) {
      session.sftp.end();
      this.sessions.delete(sessionId);
      this.logger.info(`SFTP closed for session ${sessionId}`);
    }
  }

  /**
   * Dispose all sessions
   */
  disposeAll(): void {
    for (const [sessionId] of this.sessions) {
      this.closeSFTP(sessionId);
    }
  }
}
