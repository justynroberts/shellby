import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { SSHManager } from './services/ssh/SSHManager';
import { ConnectionManager } from './services/connection/ConnectionManager';
import { ClipboardManager } from './services/clipboard/ClipboardManager';
import { SFTPManager } from './services/sftp/SFTPManager';
import { AIManager } from './services/ai/AIManager';
import { SnippetManager } from './services/snippets/SnippetManager';
import { Logger } from './utils/logger';
import { IPCChannels } from '../shared/types/ipc';

const logger = new Logger('Main');

// Service instances
const sshManager = new SSHManager();
const connectionManager = new ConnectionManager();
const clipboardManager = new ClipboardManager();
const sftpManager = new SFTPManager();
const aiManager = new AIManager();
const snippetManager = new SnippetManager();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  logger.info('Creating main window');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Disable for development
      preload: path.join(__dirname, '../preload/index.js'),
    },
    title: 'Shelby',
    backgroundColor: '#1e1e1e',
    show: false,
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  const indexPath = path.join(__dirname, '../renderer/index.html');
  logger.info('Loading index from:', indexPath);

  mainWindow.loadFile(indexPath).catch((err) => {
    logger.error('Failed to load index.html:', err);
  });

  // DevTools can be opened manually with Cmd+Option+I if needed

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup basic IPC handlers
function setupIPC() {
  logger.info('Setting up IPC handlers');

  // SSH Connect
  ipcMain.handle(IPCChannels.SSH_CONNECT, async (event, config) => {
    try {
      logger.info('IPC: SSH Connect requested');
      const sessionId = await sshManager.connect(config);
      return { success: true, data: sessionId };
    } catch (error: any) {
      logger.error('IPC: SSH Connect failed:', error);
      return { success: false, error: error.message };
    }
  });

  // SSH Disconnect
  ipcMain.handle(IPCChannels.SSH_DISCONNECT, async (event, { sessionId }) => {
    try {
      logger.info('IPC: SSH Disconnect requested for', sessionId);
      await sshManager.disconnect(sessionId);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SSH Disconnect failed:', error);
      return { success: false, error: error.message };
    }
  });

  // SSH Send Data
  ipcMain.handle(IPCChannels.SSH_SEND_DATA, async (event, { sessionId, data }) => {
    try {
      sshManager.sendData(sessionId, data);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SSH Send Data failed:', error);
      return { success: false, error: error.message };
    }
  });

  // SSH Resize
  ipcMain.handle(IPCChannels.SSH_RESIZE, async (event, { sessionId, cols, rows }) => {
    try {
      sshManager.resize(sessionId, cols, rows);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SSH Resize failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Forward SSH events to renderer
  sshManager.on('data', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCChannels.EVENT_SSH_DATA, data);
    }
  });

  sshManager.on('status', (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCChannels.EVENT_SSH_STATUS, status);
    }
  });

  sshManager.on('error', (error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCChannels.EVENT_SSH_ERROR, error);
    }
  });

  // Clipboard Handlers
  ipcMain.handle(IPCChannels.CLIPBOARD_COPY, async (event, { text, source }) => {
    try {
      const id = clipboardManager.copy(text, source || 'manual');
      return { success: true, data: id };
    } catch (error: any) {
      logger.error('IPC: Clipboard Copy failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CLIPBOARD_PASTE, async (event) => {
    try {
      const text = clipboardManager.paste();
      return { success: true, data: text };
    } catch (error: any) {
      logger.error('IPC: Clipboard Paste failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CLIPBOARD_GET_HISTORY, async (event) => {
    try {
      const history = clipboardManager.getHistory();
      return { success: true, data: history };
    } catch (error: any) {
      logger.error('IPC: Clipboard Get History failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CLIPBOARD_COPY_FROM_HISTORY, async (event, { id }) => {
    try {
      const success = clipboardManager.copyFromHistory(id);
      return { success, error: success ? undefined : 'Entry not found' };
    } catch (error: any) {
      logger.error('IPC: Clipboard Copy From History failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CLIPBOARD_DELETE_ENTRY, async (event, { id }) => {
    try {
      const success = clipboardManager.deleteEntry(id);
      return { success, error: success ? undefined : 'Entry not found' };
    } catch (error: any) {
      logger.error('IPC: Clipboard Delete Entry failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CLIPBOARD_CLEAR_HISTORY, async (event) => {
    try {
      clipboardManager.clearHistory();
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: Clipboard Clear History failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CLIPBOARD_CLEAR, async (event) => {
    try {
      clipboardManager.clearClipboard();
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: Clipboard Clear failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CLIPBOARD_SEARCH, async (event, { query }) => {
    try {
      const results = clipboardManager.searchHistory(query);
      return { success: true, data: results };
    } catch (error: any) {
      logger.error('IPC: Clipboard Search failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Connection Profile Handlers
  ipcMain.handle(IPCChannels.CONNECTION_SAVE, async (event, profile) => {
    try {
      const id = profile.id
        ? (await connectionManager.updateProfile(profile.id, profile), profile.id)
        : await connectionManager.addProfile(profile);
      return { success: true, data: id };
    } catch (error: any) {
      logger.error('IPC: Connection Save failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CONNECTION_DELETE, async (event, { id }) => {
    try {
      await connectionManager.deleteProfile(id);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: Connection Delete failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CONNECTION_GET, async (event, { id }) => {
    try {
      const profile = await connectionManager.getProfile(id);
      return { success: true, data: profile };
    } catch (error: any) {
      logger.error('IPC: Connection Get failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.CONNECTION_LIST, async (event) => {
    try {
      const profiles = await connectionManager.listProfiles();
      return { success: true, data: profiles };
    } catch (error: any) {
      logger.error('IPC: Connection List failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('connection:toggle-favorite', async (event, { id }) => {
    try {
      await connectionManager.toggleFavorite(id);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: Toggle Favorite failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('connection:select-key-file', async (event) => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Private Key File',
        filters: [
          { name: 'Private Keys', extensions: ['pem', 'key', 'ppk'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'Cancelled' };
      }

      const keyPath = result.filePaths[0];
      const keyContent = fs.readFileSync(keyPath, 'utf-8');

      return { success: true, data: { path: keyPath, content: keyContent } };
    } catch (error: any) {
      logger.error('IPC: Select Key File failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('connection:export-profiles', async (event, { profiles }) => {
    try {
      logger.info('IPC: Export Profiles requested');

      // Strip sensitive data from profiles
      const sanitizedProfiles = profiles.map((profile: any) => {
        const { password, privateKey, passphrase, certificate, ...safeProfile } = profile;
        return safeProfile;
      });

      const result = await dialog.showSaveDialog({
        title: 'Export Connection Profiles',
        defaultPath: 'shellby-connections.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Cancelled' };
      }

      fs.writeFileSync(result.filePath, JSON.stringify(sanitizedProfiles, null, 2), 'utf-8');
      logger.info('IPC: Profiles exported to:', result.filePath);

      return { success: true, data: { path: result.filePath, count: sanitizedProfiles.length } };
    } catch (error: any) {
      logger.error('IPC: Export Profiles failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('connection:import-profiles', async (event) => {
    try {
      logger.info('IPC: Import Profiles requested');

      const result = await dialog.showOpenDialog({
        title: 'Import Connection Profiles',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'Cancelled' };
      }

      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const profiles = JSON.parse(fileContent);

      if (!Array.isArray(profiles)) {
        return { success: false, error: 'Invalid file format: expected array of profiles' };
      }

      logger.info('IPC: Imported', profiles.length, 'profiles from:', filePath);

      return { success: true, data: profiles };
    } catch (error: any) {
      logger.error('IPC: Import Profiles failed:', error);
      return { success: false, error: error.message };
    }
  });

  // SFTP Handlers
  ipcMain.handle(IPCChannels.SFTP_INIT, async (event, { sessionId }) => {
    try {
      logger.info('IPC: SFTP Init requested for', sessionId);
      // Get the SSH client from SSHManager
      const client = (sshManager as any).sessions.get(sessionId)?.client;
      if (!client) {
        throw new Error('SSH session not found');
      }
      await sftpManager.initSFTP(sessionId, client);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SFTP Init failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_LIST_DIRECTORY, async (event, { sessionId, path }) => {
    try {
      logger.info('IPC: SFTP List Directory requested:', path);
      const listing = await sftpManager.listDirectory(sessionId, path);
      return { success: true, data: listing };
    } catch (error: any) {
      logger.error('IPC: SFTP List Directory failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_UPLOAD, async (event, { sessionId, localPath, remotePath }) => {
    try {
      logger.info('IPC: SFTP Upload requested:', localPath, '->', remotePath);
      const transferId = await sftpManager.uploadFile(sessionId, localPath, remotePath);
      return { success: true, data: transferId };
    } catch (error: any) {
      logger.error('IPC: SFTP Upload failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_DOWNLOAD, async (event, { sessionId, remotePath, localPath }) => {
    try {
      logger.info('IPC: SFTP Download requested:', remotePath, '->', localPath);
      const transferId = await sftpManager.downloadFile(sessionId, remotePath, localPath);
      return { success: true, data: transferId };
    } catch (error: any) {
      logger.error('IPC: SFTP Download failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_UPLOAD_DIRECTORY, async (event, { sessionId, localPath, remotePath }) => {
    try {
      logger.info('IPC: SFTP Upload Directory requested:', localPath, '->', remotePath);
      const transferIds = await sftpManager.uploadDirectory(sessionId, localPath, remotePath);
      return { success: true, data: transferIds };
    } catch (error: any) {
      logger.error('IPC: SFTP Upload Directory failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_DOWNLOAD_DIRECTORY, async (event, { sessionId, remotePath, localPath }) => {
    try {
      logger.info('IPC: SFTP Download Directory requested:', remotePath, '->', localPath);
      const transferIds = await sftpManager.downloadDirectory(sessionId, remotePath, localPath);
      return { success: true, data: transferIds };
    } catch (error: any) {
      logger.error('IPC: SFTP Download Directory failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_MKDIR, async (event, { sessionId, dirPath }) => {
    try {
      logger.info('IPC: SFTP Create Directory requested:', dirPath);
      await sftpManager.createDirectory(sessionId, dirPath);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SFTP Create Directory failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_DELETE, async (event, { sessionId, filePath }) => {
    try {
      logger.info('IPC: SFTP Delete File requested:', filePath);
      await sftpManager.deleteFile(sessionId, filePath);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SFTP Delete File failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_RMDIR, async (event, { sessionId, dirPath }) => {
    try {
      logger.info('IPC: SFTP Remove Directory requested:', dirPath);
      await sftpManager.deleteDirectory(sessionId, dirPath);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SFTP Remove Directory failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_RENAME, async (event, { sessionId, oldPath, newPath }) => {
    try {
      logger.info('IPC: SFTP Rename requested:', oldPath, '->', newPath);
      await sftpManager.rename(sessionId, oldPath, newPath);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SFTP Rename failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_CHMOD, async (event, { sessionId, filePath, mode }) => {
    try {
      logger.info('IPC: SFTP Chmod requested:', filePath, mode);
      await sftpManager.chmod(sessionId, filePath, mode);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: SFTP Chmod failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_GET_TRANSFERS, async (event) => {
    try {
      const transfers = sftpManager.getTransfers();
      return { success: true, data: transfers };
    } catch (error: any) {
      logger.error('IPC: SFTP Get Transfers failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Forward SFTP events to renderer
  sftpManager.on('transfer-started', (transfer) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCChannels.EVENT_TRANSFER_STATUS, {
        transferId: transfer.id,
        status: 'started',
        transfer
      });
    }
  });

  sftpManager.on('transfer-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCChannels.EVENT_TRANSFER_PROGRESS, progress);
    }
  });

  sftpManager.on('transfer-completed', (transfer) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCChannels.EVENT_TRANSFER_STATUS, {
        transferId: transfer.id,
        status: 'completed',
        transfer
      });
    }
  });

  sftpManager.on('transfer-failed', (transfer) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCChannels.EVENT_TRANSFER_STATUS, {
        transferId: transfer.id,
        status: 'failed',
        error: transfer.error,
        transfer
      });
    }
  });

  // Local Filesystem Handlers
  ipcMain.handle(IPCChannels.FS_LIST_DIRECTORY, async (event, { path: dirPath }) => {
    try {
      logger.info('IPC: FS List Directory requested:', dirPath);
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      const fileEntries = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          try {
            const stats = await fs.promises.stat(fullPath);
            return {
              name: entry.name,
              path: fullPath,
              type: entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file',
              size: stats.size,
              modifyTime: stats.mtime,
              accessTime: stats.atime,
              permissions: {
                user: { read: true, write: true, execute: true },
                group: { read: true, write: false, execute: true },
                others: { read: true, write: false, execute: false },
                mode: (stats.mode & 0o777).toString(8).padStart(3, '0'),
              },
              owner: stats.uid?.toString() || '0',
              group: stats.gid?.toString() || '0',
            };
          } catch (err) {
            // If we can't stat the file, return basic info
            return {
              name: entry.name,
              path: fullPath,
              type: entry.isDirectory() ? 'directory' : 'file',
              size: 0,
              modifyTime: new Date(),
              accessTime: new Date(),
              permissions: {
                user: { read: false, write: false, execute: false },
                group: { read: false, write: false, execute: false },
                others: { read: false, write: false, execute: false },
                mode: '000',
              },
              owner: '0',
              group: '0',
            };
          }
        })
      );

      return { success: true, data: { path: dirPath, entries: fileEntries } };
    } catch (error: any) {
      logger.error('IPC: FS List Directory failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.FS_GET_HOME, async (event) => {
    try {
      const homeDir = require('os').homedir();
      return { success: true, data: homeDir };
    } catch (error: any) {
      logger.error('IPC: FS Get Home failed:', error);
      return { success: false, error: error.message };
    }
  });

  // AI Assistant Handlers
  ipcMain.handle(IPCChannels.AI_GET_SETTINGS, async (event) => {
    try {
      const settings = aiManager.getSettings();
      return { success: true, data: settings };
    } catch (error: any) {
      logger.error('IPC: AI Get Settings failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.AI_UPDATE_SETTINGS, async (event, { settings }) => {
    try {
      logger.info('IPC: AI Update Settings requested');
      aiManager.updateSettings(settings);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: AI Update Settings failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.AI_GENERATE_COMMAND, async (event, { prompt, context }) => {
    try {
      logger.info('IPC: AI Generate Command requested');
      const command = await aiManager.generateCommand(prompt, context);
      return { success: true, data: command };
    } catch (error: any) {
      logger.error('IPC: AI Generate Command failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.AI_EXPLAIN_ERROR, async (event, { errorText, context }) => {
    try {
      logger.info('IPC: AI Explain Error requested');
      const explanation = await aiManager.explainError(errorText, context);
      return { success: true, data: explanation };
    } catch (error: any) {
      logger.error('IPC: AI Explain Error failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.AI_ANALYZE_LOGS, async (event, { logs, question }) => {
    try {
      logger.info('IPC: AI Analyze Logs requested');
      const analysis = await aiManager.analyzeLogs(logs, question);
      return { success: true, data: analysis };
    } catch (error: any) {
      logger.error('IPC: AI Analyze Logs failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.AI_CHAT, async (event, { messages, context }) => {
    try {
      logger.info('IPC: AI Chat requested');
      const response = await aiManager.chat(messages, context);
      return { success: true, data: response };
    } catch (error: any) {
      logger.error('IPC: AI Chat failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.AI_GENERATE_SCRIPT, async (event, { task, language }) => {
    try {
      logger.info('IPC: AI Generate Script requested');
      const script = await aiManager.generateScript(task, language);
      return { success: true, data: script };
    } catch (error: any) {
      logger.error('IPC: AI Generate Script failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:get-ollama-models', async (event) => {
    try {
      logger.info('IPC: Get Ollama Models requested');
      const models = await aiManager.getOllamaModels();
      return { success: true, data: models };
    } catch (error: any) {
      logger.error('IPC: Get Ollama Models failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Snippet Handlers
  ipcMain.handle(IPCChannels.SNIPPET_GET_ALL, async (event) => {
    try {
      const snippets = snippetManager.getSnippets();
      return { success: true, data: snippets };
    } catch (error: any) {
      logger.error('IPC: Snippet Get All failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_GET, async (event, { id }) => {
    try {
      const snippet = snippetManager.getSnippet(id);
      if (!snippet) {
        return { success: false, error: 'Snippet not found' };
      }
      return { success: true, data: snippet };
    } catch (error: any) {
      logger.error('IPC: Snippet Get failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_CREATE, async (event, { snippet }) => {
    try {
      const newSnippet = snippetManager.createSnippet(snippet);
      return { success: true, data: newSnippet };
    } catch (error: any) {
      logger.error('IPC: Snippet Create failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_UPDATE, async (event, { id, updates }) => {
    try {
      const updatedSnippet = snippetManager.updateSnippet(id, updates);
      if (!updatedSnippet) {
        return { success: false, error: 'Snippet not found' };
      }
      return { success: true, data: updatedSnippet };
    } catch (error: any) {
      logger.error('IPC: Snippet Update failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_DELETE, async (event, { id }) => {
    try {
      const success = snippetManager.deleteSnippet(id);
      if (!success) {
        return { success: false, error: 'Snippet not found' };
      }
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: Snippet Delete failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_SEARCH, async (event, { query }) => {
    try {
      const snippets = snippetManager.searchSnippets(query);
      return { success: true, data: snippets };
    } catch (error: any) {
      logger.error('IPC: Snippet Search failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_GET_BY_CATEGORY, async (event, { category }) => {
    try {
      const snippets = snippetManager.getSnippetsByCategory(category);
      return { success: true, data: snippets };
    } catch (error: any) {
      logger.error('IPC: Snippet Get By Category failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_GET_MOST_USED, async (event, { limit }) => {
    try {
      const snippets = snippetManager.getMostUsed(limit || 10);
      return { success: true, data: snippets };
    } catch (error: any) {
      logger.error('IPC: Snippet Get Most Used failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_INCREMENT_USAGE, async (event, { id }) => {
    try {
      snippetManager.incrementUsage(id);
      return { success: true };
    } catch (error: any) {
      logger.error('IPC: Snippet Increment Usage failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_TOGGLE_FAVORITE, async (event, { id }) => {
    try {
      const snippet = snippetManager.toggleFavorite(id);
      if (!snippet) {
        return { success: false, error: 'Snippet not found' };
      }
      return { success: true, data: snippet };
    } catch (error: any) {
      logger.error('IPC: Snippet Toggle Favorite failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SNIPPET_GET_FAVORITES, async (event) => {
    try {
      const snippets = snippetManager.getFavorites();
      return { success: true, data: snippets };
    } catch (error: any) {
      logger.error('IPC: Snippet Get Favorites failed:', error);
      return { success: false, error: error.message };
    }
  });

  logger.info('IPC handlers registered');
}

// App lifecycle
app.whenReady().then(() => {
  logger.info('App is ready');
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logger.info('All windows closed');
  sshManager.disconnectAll();
  sftpManager.disposeAll();
  clipboardManager.dispose();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('App is quitting, cleaning up');
  sshManager.disconnectAll();
  sftpManager.disposeAll();
  clipboardManager.dispose();
});

app.on('will-quit', () => {
  logger.info('App will quit');
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
});
