import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Constants for log file management
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB max log file size
const MAX_LOG_FILES = 3; // Keep only 3 log files

export class Logger {
  private context: string;
  private logFilePath: string;
  private logLevel: LogLevel;
  private writeBuffer: string[] = [];
  private writeTimer: NodeJS.Timeout | null = null;
  private lastSizeCheck: number = 0;

  constructor(context: string, logLevel: LogLevel = 'error') {
    this.context = context;
    // Only log errors by default to prevent runaway logs
    this.logLevel = logLevel;

    // Set up log file path
    const userDataPath = app?.getPath?.('userData') || path.join(process.cwd(), 'logs');
    const logsDir = path.join(userDataPath, 'logs');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0];
    this.logFilePath = path.join(logsDir, `app-${today}.log`);

    // Clean up old log files on startup
    this.cleanupOldLogs(logsDir);
  }

  private cleanupOldLogs(logsDir: string): void {
    try {
      const files = fs.readdirSync(logsDir);
      const logFiles = files
        .filter(f => f.startsWith('app-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(logsDir, f),
          mtime: fs.statSync(path.join(logsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Delete old files beyond MAX_LOG_FILES
      logFiles.slice(MAX_LOG_FILES).forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          // Ignore errors on cleanup
        }
      });
    } catch (e) {
      // Ignore errors on cleanup
    }
  }

  private checkLogSize(): boolean {
    try {
      const now = Date.now();
      // Only check size once per minute to avoid excessive stat calls
      if (now - this.lastSizeCheck < 60000) {
        return true;
      }
      this.lastSizeCheck = now;

      if (fs.existsSync(this.logFilePath)) {
        const stats = fs.statSync(this.logFilePath);
        if (stats.size > MAX_LOG_SIZE) {
          // Rotate the log by renaming it
          const rotated = this.logFilePath.replace('.log', `-${Date.now()}.log`);
          fs.renameSync(this.logFilePath, rotated);
          return true;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const argsStr = args.length > 0 ? ' ' + JSON.stringify(args) : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${argsStr}`;
  }

  private writeToFile(message: string): void {
    try {
      // Check log size before writing
      if (!this.checkLogSize()) {
        return; // Skip writing if size check fails
      }

      // Buffer writes and flush periodically to reduce I/O
      this.writeBuffer.push(message);

      if (this.writeBuffer.length >= 50) {
        this.flushBuffer();
      } else if (!this.writeTimer) {
        this.writeTimer = setTimeout(() => this.flushBuffer(), 1000);
      }
    } catch (error) {
      // Fail silently to prevent runaway errors
    }
  }

  private flushBuffer(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }

    if (this.writeBuffer.length === 0) {
      return;
    }

    try {
      const content = this.writeBuffer.join('\n') + '\n';
      this.writeBuffer = [];
      fs.appendFileSync(this.logFilePath, content, 'utf-8');
    } catch (error) {
      // Fail silently
      this.writeBuffer = [];
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, ...args);

    // Write to file
    this.writeToFile(formattedMessage);

    // Also log to console
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
}
