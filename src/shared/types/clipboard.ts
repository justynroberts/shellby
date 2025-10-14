export interface ClipboardEntry {
  id: string;
  content: string;
  timestamp: Date;
  source: 'terminal' | 'manual';
}

export interface ClipboardHistoryOptions {
  maxEntries?: number;
  autoClear?: boolean;
  autoClearTimeout?: number; // milliseconds
}
