import { Client, ClientChannel } from 'ssh2';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  SSHConnectionConfig,
  SSHSession,
  SSHConnectionStatus,
  CommandResult,
} from '../../../shared/types/ssh';
import { DEFAULT_SSH_CONFIG, DEFAULT_TERMINAL_CONFIG } from '../../../shared/constants/defaults';
import { Logger } from '../../utils/logger';

interface SSHClientInstance {
  client: Client;
  channel?: ClientChannel;
  session: SSHSession;
  reconnectAttempts: number;
  keepaliveTimer?: NodeJS.Timeout;
}

export class SSHManager extends EventEmitter {
  private sessions: Map<string, SSHClientInstance> = new Map();
  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('SSHManager');
  }

  async connect(config: SSHConnectionConfig): Promise<string> {
    const sessionId = config.id || uuidv4();

    this.logger.info(`Connecting to ${config.username}@${config.host}:${config.port}`);

    const fullConfig = { ...DEFAULT_SSH_CONFIG, ...config };

    const session: SSHSession = {
      id: sessionId,
      config: fullConfig,
      status: 'connecting',
      createdAt: new Date(),
      lastActivity: new Date(),
      terminalCols: DEFAULT_TERMINAL_CONFIG.cols,
      terminalRows: DEFAULT_TERMINAL_CONFIG.rows,
    };

    const client = new Client();

    this.sessions.set(sessionId, {
      client,
      session,
      reconnectAttempts: 0,
    });

    return new Promise((resolve, reject) => {
      client.on('ready', async () => {
        this.logger.info(`SSH connection established for session ${sessionId}`);

        session.status = 'connected';
        session.connectedAt = new Date();

        this.emit('status', {
          sessionId,
          status: 'connected',
        });

        try {
          await this.openShell(sessionId);
          resolve(sessionId);
        } catch (error) {
          reject(error);
        }
      });

      client.on('error', (err: Error) => {
        this.logger.error(`SSH error for session ${sessionId}:`, err);
        session.status = 'error';

        this.emit('error', {
          sessionId,
          error: err.message,
        });

        reject(err);
      });

      client.on('close', () => {
        this.logger.info(`SSH connection closed for session ${sessionId}`);
        session.status = 'disconnected';

        this.emit('status', {
          sessionId,
          status: 'disconnected',
        });

        this.cleanup(sessionId);
      });

      // Connect with configuration
      const connectConfig: any = {
        host: fullConfig.host,
        port: fullConfig.port,
        username: fullConfig.username,
        keepaliveInterval: fullConfig.keepaliveInterval,
        keepaliveCountMax: fullConfig.keepaliveCountMax,
        readyTimeout: fullConfig.readyTimeout,
      };

      // Add authentication
      if (fullConfig.authMethod === 'password' && fullConfig.password) {
        connectConfig.password = fullConfig.password;
      } else if (fullConfig.authMethod === 'publickey' && fullConfig.privateKey) {
        connectConfig.privateKey = fullConfig.privateKey;
        if (fullConfig.passphrase) {
          connectConfig.passphrase = fullConfig.passphrase;
        }
      }

      // Jump host support
      if (fullConfig.jumpHost) {
        this.connectViaJumpHost(client, fullConfig, connectConfig, sessionId)
          .catch(reject);
      } else {
        client.connect(connectConfig);
      }
    });
  }

  private async connectViaJumpHost(
    client: Client,
    config: SSHConnectionConfig,
    connectConfig: any,
    sessionId: string
  ): Promise<void> {
    const jumpHost = config.jumpHost!;
    const jumpClient = new Client();

    return new Promise((resolve, reject) => {
      jumpClient.on('ready', () => {
        this.logger.info(`Connected to jump host ${jumpHost.host}`);

        jumpClient.forwardOut(
          '127.0.0.1',
          0,
          config.host!,
          config.port!,
          (err, stream) => {
            if (err) {
              reject(err);
              return;
            }

            connectConfig.sock = stream;
            client.connect(connectConfig);
            resolve();
          }
        );
      });

      jumpClient.on('error', reject);

      jumpClient.connect({
        host: jumpHost.host,
        port: jumpHost.port,
        username: jumpHost.username,
        password: jumpHost.password,
        privateKey: jumpHost.privateKey,
        passphrase: jumpHost.passphrase,
      });
    });
  }

  private async openShell(sessionId: string): Promise<void> {
    const instance = this.sessions.get(sessionId);
    if (!instance) {
      throw new Error('Session not found');
    }

    const { client, session } = instance;

    return new Promise((resolve, reject) => {
      client.shell(
        {
          cols: session.terminalCols,
          rows: session.terminalRows,
          term: 'xterm-256color',
          // Add environment variables for better TUI support
          env: {
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
            LANG: 'en_US.UTF-8',
            LC_ALL: 'en_US.UTF-8',
          },
          // Set PTY modes for proper interactive application support
          modes: {
            // Input modes
            ICANON: 0,    // Disable canonical mode (line buffering)
            ECHO: 1,      // Enable echo
            ECHOE: 1,     // Enable erase character echo
            ECHOK: 1,     // Enable kill character echo
            ECHONL: 0,    // Disable newline echo
            ISIG: 1,      // Enable signal characters
            IEXTEN: 1,    // Enable extended input processing
            ICRNL: 1,     // Map CR to NL on input
            // Output modes
            OPOST: 1,     // Enable output processing
            ONLCR: 1,     // Map NL to CR-NL on output
            // Control modes
            CS8: 1,       // 8-bit characters
            PARENB: 0,    // Disable parity
            // Local modes
            TOSTOP: 0,    // Disable background write stopping
          },
        },
        (err, channel) => {
          if (err) {
            reject(err);
            return;
          }

          instance.channel = channel;

          channel.on('data', (data: Buffer) => {
            session.lastActivity = new Date();
            this.emit('data', {
              sessionId,
              data: data.toString('utf-8'),
            });
          });

          channel.on('close', () => {
            this.logger.info(`Shell channel closed for session ${sessionId}`);
            this.disconnect(sessionId);
          });

          channel.stderr.on('data', (data: Buffer) => {
            this.emit('data', {
              sessionId,
              data: data.toString('utf-8'),
            });
          });

          // Handle channel errors
          channel.on('error', (error: Error) => {
            this.logger.error(`Channel error for session ${sessionId}:`, error);
          });

          resolve();
        }
      );
    });
  }

  sendData(sessionId: string, data: string): void {
    const instance = this.sessions.get(sessionId);
    if (!instance || !instance.channel) {
      return;
    }

    instance.channel.write(data);
    instance.session.lastActivity = new Date();
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const instance = this.sessions.get(sessionId);
    if (!instance || !instance.channel) {
      return;
    }

    instance.session.terminalCols = cols;
    instance.session.terminalRows = rows;

    // Send window change signal with proper pixel dimensions
    // Many TUI apps (like k9s, vim, htop) rely on this
    const pixelWidth = cols * 8;  // Approximate char width
    const pixelHeight = rows * 16; // Approximate char height

    instance.channel.setWindow(rows, cols, pixelHeight, pixelWidth);

    this.logger.debug(`Resized terminal for session ${sessionId} to ${cols}x${rows}`);
  }

  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    const instance = this.sessions.get(sessionId);
    if (!instance) {
      throw new Error('Session not found');
    }

    const { client } = instance;

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      client.exec(command, (err, channel) => {
        if (err) {
          reject(err);
          return;
        }

        channel.on('data', (data: Buffer) => {
          stdout += data.toString('utf-8');
        });

        channel.stderr.on('data', (data: Buffer) => {
          stderr += data.toString('utf-8');
        });

        channel.on('close', (code: number) => {
          resolve({
            stdout,
            stderr,
            exitCode: code,
          });
        });
      });
    });
  }

  async disconnect(sessionId: string): Promise<void> {
    const instance = this.sessions.get(sessionId);
    if (!instance) {
      return;
    }

    this.logger.info(`Disconnecting session ${sessionId}`);

    instance.session.status = 'disconnecting';

    if (instance.keepaliveTimer) {
      clearInterval(instance.keepaliveTimer);
    }

    if (instance.channel) {
      instance.channel.end();
    }

    instance.client.end();

    this.cleanup(sessionId);
  }

  private cleanup(sessionId: string): void {
    const instance = this.sessions.get(sessionId);
    if (instance) {
      if (instance.keepaliveTimer) {
        clearInterval(instance.keepaliveTimer);
      }
      this.sessions.delete(sessionId);
    }
  }

  getSession(sessionId: string): SSHSession | undefined {
    return this.sessions.get(sessionId)?.session;
  }

  getAllSessions(): SSHSession[] {
    return Array.from(this.sessions.values()).map(instance => instance.session);
  }

  disconnectAll(): void {
    for (const sessionId of this.sessions.keys()) {
      this.disconnect(sessionId);
    }
  }
}
