import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannels } from '../shared/types/ipc';

// Expose protected methods that renderer can call
contextBridge.exposeInMainWorld('electron', {
  // Connection Profile API
  connections: {
    save: (profile: any) => ipcRenderer.invoke(IPCChannels.CONNECTION_SAVE, profile),
    delete: (id: string) => ipcRenderer.invoke(IPCChannels.CONNECTION_DELETE, { id }),
    get: (id: string) => ipcRenderer.invoke(IPCChannels.CONNECTION_GET, { id }),
    list: () => ipcRenderer.invoke(IPCChannels.CONNECTION_LIST),
    toggleFavorite: (id: string) => ipcRenderer.invoke('connection:toggle-favorite', { id }),
    selectKeyFile: () => ipcRenderer.invoke('connection:select-key-file'),
    exportProfiles: (profiles: any[]) => ipcRenderer.invoke('connection:export-profiles', { profiles }),
    importProfiles: () => ipcRenderer.invoke('connection:import-profiles'),
  },

  // Clipboard API
  clipboard: {
    copy: (text: string, source?: 'terminal' | 'manual') =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_COPY, { text, source }),

    paste: () =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_PASTE),

    getHistory: () =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_GET_HISTORY),

    copyFromHistory: (id: string) =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_COPY_FROM_HISTORY, { id }),

    deleteEntry: (id: string) =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_DELETE_ENTRY, { id }),

    clearHistory: () =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_CLEAR_HISTORY),

    clear: () =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_CLEAR),

    search: (query: string) =>
      ipcRenderer.invoke(IPCChannels.CLIPBOARD_SEARCH, { query }),
  },

  // SSH API
  ssh: {
    connect: (config: any) => ipcRenderer.invoke(IPCChannels.SSH_CONNECT, config),

    disconnect: (sessionId: string) =>
      ipcRenderer.invoke(IPCChannels.SSH_DISCONNECT, { sessionId }),

    sendData: (sessionId: string, data: string) =>
      ipcRenderer.invoke(IPCChannels.SSH_SEND_DATA, { sessionId, data }),

    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.invoke(IPCChannels.SSH_RESIZE, { sessionId, cols, rows }),

    onData: (callback: (data: any) => void) => {
      const subscription = (event: any, data: any) => callback(data);
      ipcRenderer.on(IPCChannels.EVENT_SSH_DATA, subscription);
      return () => {
        ipcRenderer.removeListener(IPCChannels.EVENT_SSH_DATA, subscription);
      };
    },

    onStatus: (callback: (status: any) => void) => {
      const subscription = (event: any, status: any) => callback(status);
      ipcRenderer.on(IPCChannels.EVENT_SSH_STATUS, subscription);
      return () => {
        ipcRenderer.removeListener(IPCChannels.EVENT_SSH_STATUS, subscription);
      };
    },

    onError: (callback: (error: any) => void) => {
      const subscription = (event: any, error: any) => callback(error);
      ipcRenderer.on(IPCChannels.EVENT_SSH_ERROR, subscription);
      return () => {
        ipcRenderer.removeListener(IPCChannels.EVENT_SSH_ERROR, subscription);
      };
    },
  },

  // SFTP API
  sftp: {
    init: (sessionId: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_INIT, { sessionId }),

    listDirectory: (sessionId: string, path: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_LIST_DIRECTORY, { sessionId, path }),

    upload: (sessionId: string, localPath: string, remotePath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_UPLOAD, { sessionId, localPath, remotePath }),

    download: (sessionId: string, remotePath: string, localPath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_DOWNLOAD, { sessionId, remotePath, localPath }),

    uploadDirectory: (sessionId: string, localPath: string, remotePath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_UPLOAD_DIRECTORY, { sessionId, localPath, remotePath }),

    downloadDirectory: (sessionId: string, remotePath: string, localPath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_DOWNLOAD_DIRECTORY, { sessionId, remotePath, localPath }),

    delete: (sessionId: string, filePath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_DELETE, { sessionId, filePath }),

    rename: (sessionId: string, oldPath: string, newPath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_RENAME, { sessionId, oldPath, newPath }),

    mkdir: (sessionId: string, dirPath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_MKDIR, { sessionId, dirPath }),

    rmdir: (sessionId: string, dirPath: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_RMDIR, { sessionId, dirPath }),

    chmod: (sessionId: string, filePath: string, mode: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_CHMOD, { sessionId, filePath, mode }),

    getTransfers: () =>
      ipcRenderer.invoke(IPCChannels.SFTP_GET_TRANSFERS),

    onTransferProgress: (callback: (progress: any) => void) => {
      const subscription = (event: any, progress: any) => callback(progress);
      ipcRenderer.on(IPCChannels.EVENT_TRANSFER_PROGRESS, subscription);
      return () => {
        ipcRenderer.removeListener(IPCChannels.EVENT_TRANSFER_PROGRESS, subscription);
      };
    },

    onTransferStatus: (callback: (status: any) => void) => {
      const subscription = (event: any, status: any) => callback(status);
      ipcRenderer.on(IPCChannels.EVENT_TRANSFER_STATUS, subscription);
      return () => {
        ipcRenderer.removeListener(IPCChannels.EVENT_TRANSFER_STATUS, subscription);
      };
    },
  },

  // Local Filesystem API
  fs: {
    listDirectory: (path: string) =>
      ipcRenderer.invoke(IPCChannels.FS_LIST_DIRECTORY, { path }),

    getHome: () =>
      ipcRenderer.invoke(IPCChannels.FS_GET_HOME),
  },

  // AI Assistant API
  ai: {
    getSettings: () =>
      ipcRenderer.invoke(IPCChannels.AI_GET_SETTINGS),

    updateSettings: (settings: any) =>
      ipcRenderer.invoke(IPCChannels.AI_UPDATE_SETTINGS, { settings }),

    generateCommand: (prompt: string, context?: string) =>
      ipcRenderer.invoke(IPCChannels.AI_GENERATE_COMMAND, { prompt, context }),

    explainError: (errorText: string, context?: string) =>
      ipcRenderer.invoke(IPCChannels.AI_EXPLAIN_ERROR, { errorText, context }),

    analyzeLogs: (logs: string, question?: string) =>
      ipcRenderer.invoke(IPCChannels.AI_ANALYZE_LOGS, { logs, question }),

    chat: (messages: any[], context?: string) =>
      ipcRenderer.invoke(IPCChannels.AI_CHAT, { messages, context }),

    generateScript: (task: string, language?: 'bash' | 'python') =>
      ipcRenderer.invoke(IPCChannels.AI_GENERATE_SCRIPT, { task, language }),
  },

  // Snippets API
  snippets: {
    getAll: () =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_GET_ALL),

    get: (id: string) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_GET, { id }),

    create: (snippet: any) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_CREATE, { snippet }),

    update: (id: string, updates: any) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_UPDATE, { id, updates }),

    delete: (id: string) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_DELETE, { id }),

    search: (query: string) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_SEARCH, { query }),

    getByCategory: (category: string) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_GET_BY_CATEGORY, { category }),

    getMostUsed: (limit?: number) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_GET_MOST_USED, { limit }),

    incrementUsage: (id: string) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_INCREMENT_USAGE, { id }),

    toggleFavorite: (id: string) =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_TOGGLE_FAVORITE, { id }),

    getFavorites: () =>
      ipcRenderer.invoke(IPCChannels.SNIPPET_GET_FAVORITES),
  },
});

// Type declarations for window.electron
declare global {
  interface Window {
    electron: {
      connections: {
        save: (profile: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
        get: (id: string) => Promise<any>;
        list: () => Promise<any>;
        toggleFavorite: (id: string) => Promise<any>;
        selectKeyFile: () => Promise<any>;
        exportProfiles: (profiles: any[]) => Promise<any>;
        importProfiles: () => Promise<any>;
      };
      clipboard: {
        copy: (text: string, source?: 'terminal' | 'manual') => Promise<any>;
        paste: () => Promise<any>;
        getHistory: () => Promise<any>;
        copyFromHistory: (id: string) => Promise<any>;
        deleteEntry: (id: string) => Promise<any>;
        clearHistory: () => Promise<any>;
        clear: () => Promise<any>;
        search: (query: string) => Promise<any>;
      };
      ssh: {
        connect: (config: any) => Promise<any>;
        disconnect: (sessionId: string) => Promise<any>;
        sendData: (sessionId: string, data: string) => Promise<any>;
        resize: (sessionId: string, cols: number, rows: number) => Promise<any>;
        onData: (callback: (data: any) => void) => () => void;
        onStatus: (callback: (status: any) => void) => () => void;
        onError: (callback: (error: any) => void) => () => void;
      };
      sftp: {
        init: (sessionId: string) => Promise<any>;
        listDirectory: (sessionId: string, path: string) => Promise<any>;
        upload: (sessionId: string, localPath: string, remotePath: string) => Promise<any>;
        download: (sessionId: string, remotePath: string, localPath: string) => Promise<any>;
        uploadDirectory: (sessionId: string, localPath: string, remotePath: string) => Promise<any>;
        downloadDirectory: (sessionId: string, remotePath: string, localPath: string) => Promise<any>;
        delete: (sessionId: string, filePath: string) => Promise<any>;
        rename: (sessionId: string, oldPath: string, newPath: string) => Promise<any>;
        mkdir: (sessionId: string, dirPath: string) => Promise<any>;
        rmdir: (sessionId: string, dirPath: string) => Promise<any>;
        chmod: (sessionId: string, filePath: string, mode: string) => Promise<any>;
        getTransfers: () => Promise<any>;
        onTransferProgress: (callback: (progress: any) => void) => () => void;
        onTransferStatus: (callback: (status: any) => void) => () => void;
      };
      fs: {
        listDirectory: (path: string) => Promise<any>;
        getHome: () => Promise<any>;
      };
      ai: {
        getSettings: () => Promise<any>;
        updateSettings: (settings: any) => Promise<any>;
        generateCommand: (prompt: string, context?: string) => Promise<any>;
        explainError: (errorText: string, context?: string) => Promise<any>;
        analyzeLogs: (logs: string, question?: string) => Promise<any>;
        chat: (messages: any[], context?: string) => Promise<any>;
        generateScript: (task: string, language?: 'bash' | 'python') => Promise<any>;
      };
      snippets: {
        getAll: () => Promise<any>;
        get: (id: string) => Promise<any>;
        create: (snippet: any) => Promise<any>;
        update: (id: string, updates: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
        search: (query: string) => Promise<any>;
        getByCategory: (category: string) => Promise<any>;
        getMostUsed: (limit?: number) => Promise<any>;
        incrementUsage: (id: string) => Promise<any>;
        toggleFavorite: (id: string) => Promise<any>;
        getFavorites: () => Promise<any>;
      };
    };
  }
}
