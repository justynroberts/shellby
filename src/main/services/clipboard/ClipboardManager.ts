import { clipboard } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { ClipboardEntry, ClipboardHistoryOptions } from '../../../shared/types/clipboard';
import { Logger } from '../../utils/logger';

export class ClipboardManager {
  private logger: Logger;
  private history: ClipboardEntry[] = [];
  private options: Required<ClipboardHistoryOptions>;
  private clearTimer?: NodeJS.Timeout;

  constructor(options: ClipboardHistoryOptions = {}) {
    this.logger = new Logger('ClipboardManager');
    this.options = {
      maxEntries: options.maxEntries || 50,
      autoClear: options.autoClear || false,
      autoClearTimeout: options.autoClearTimeout || 300000, // 5 minutes default
    };

    this.logger.info('ClipboardManager initialized with options:', this.options);
  }

  /**
   * Copy text to system clipboard and add to history
   */
  copy(text: string, source: 'terminal' | 'manual' = 'manual'): string {
    if (!text || text.length === 0) {
      this.logger.warn('Attempted to copy empty text');
      return '';
    }

    try {
      // Copy to system clipboard
      clipboard.writeText(text);

      // Add to history
      const entry: ClipboardEntry = {
        id: uuidv4(),
        content: text,
        timestamp: new Date(),
        source,
      };

      this.history.unshift(entry);

      // Trim history if needed
      if (this.history.length > this.options.maxEntries) {
        this.history = this.history.slice(0, this.options.maxEntries);
      }

      this.logger.info(`Copied ${text.length} characters to clipboard (${source})`);

      // Set auto-clear timer if enabled
      if (this.options.autoClear) {
        this.resetClearTimer();
      }

      return entry.id;
    } catch (error: any) {
      this.logger.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }

  /**
   * Paste from system clipboard
   */
  paste(): string {
    try {
      const text = clipboard.readText();
      this.logger.info(`Pasted ${text.length} characters from clipboard`);
      return text;
    } catch (error: any) {
      this.logger.error('Failed to paste from clipboard:', error);
      throw error;
    }
  }

  /**
   * Get clipboard history
   */
  getHistory(): ClipboardEntry[] {
    return [...this.history];
  }

  /**
   * Get specific entry by ID
   */
  getEntry(id: string): ClipboardEntry | undefined {
    return this.history.find(entry => entry.id === id);
  }

  /**
   * Copy entry from history to clipboard
   */
  copyFromHistory(id: string): boolean {
    const entry = this.getEntry(id);
    if (!entry) {
      this.logger.warn('Entry not found in history:', id);
      return false;
    }

    try {
      clipboard.writeText(entry.content);
      this.logger.info('Copied entry from history:', id);
      return true;
    } catch (error: any) {
      this.logger.error('Failed to copy from history:', error);
      return false;
    }
  }

  /**
   * Clear clipboard history
   */
  clearHistory(): void {
    this.history = [];
    this.logger.info('Clipboard history cleared');
  }

  /**
   * Clear system clipboard
   */
  clearClipboard(): void {
    clipboard.clear();
    this.logger.info('System clipboard cleared');
  }

  /**
   * Delete specific entry from history
   */
  deleteEntry(id: string): boolean {
    const index = this.history.findIndex(entry => entry.id === id);
    if (index === -1) {
      return false;
    }

    this.history.splice(index, 1);
    this.logger.info('Deleted entry from history:', id);
    return true;
  }

  /**
   * Search history by content
   */
  searchHistory(query: string): ClipboardEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(entry =>
      entry.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<ClipboardHistoryOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };

    this.logger.info('ClipboardManager options updated:', this.options);

    // Trim history if max entries was reduced
    if (this.history.length > this.options.maxEntries) {
      this.history = this.history.slice(0, this.options.maxEntries);
    }

    // Reset timer if auto-clear was enabled or timeout changed
    if (this.options.autoClear) {
      this.resetClearTimer();
    } else {
      this.clearClearTimer();
    }
  }

  /**
   * Reset auto-clear timer
   */
  private resetClearTimer(): void {
    this.clearClearTimer();
    this.clearTimer = setTimeout(() => {
      this.clearHistory();
      this.clearClipboard();
      this.logger.info('Auto-cleared clipboard after timeout');
    }, this.options.autoClearTimeout);
  }

  /**
   * Clear auto-clear timer
   */
  private clearClearTimer(): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clearClearTimer();
    this.logger.info('ClipboardManager disposed');
  }
}
