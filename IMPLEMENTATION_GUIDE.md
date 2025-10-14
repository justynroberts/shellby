# SecureShell Pro - Implementation Guide

This guide provides detailed implementation steps and code for completing the SecureShell Pro application.

## Overview

The application is structured in layers:
1. **Main Process** - Electron main, runs Node.js services
2. **Preload Script** - Secure bridge between main and renderer
3. **Renderer Process** - React UI, sandboxed
4. **Shared** - Types and constants used by both processes

## Current Status

✅ **Completed:**
- Project structure
- Build configuration (Webpack, TypeScript)
- Shared types and constants
- SSH Manager
- Logger utility

🚧 **Next Steps in Order:**

### 1. Complete SFTP Manager

**File:** `src/main/services/sftp/SFTPManager.ts`

Key features to implement:
- SFTP connection via existing SSH session
- Directory listing with file attributes
- File upload/download
- File operations (delete, rename, chmod, mkdir)
- Stream-based transfers for large files

**Core Methods:**
```typescript
class SFTPManager {
  async openSFTP(sessionId: string): Promise<void>
  async listDirectory(sessionId: string, path: string): Promise<FileEntry[]>
  async uploadFile(sessionId: string, local: string, remote: string): Promise<Transfer>
  async downloadFile(sessionId: string, remote: string, local: string): Promise<Transfer>
  async deleteFile(sessionId: string, path: string): Promise<void>
  async createDirectory(sessionId: string, path: string): Promise<void>
}
```

**Integration:** Works with SSH Manager's connections and Transfer Queue

### 2. Implement Transfer Queue

**File:** `src/main/services/sftp/TransferQueue.ts`

Features:
- Queue management with priorities
- Concurrent transfer control (max 3 simultaneous)
- Pause/resume functionality
- Progress tracking with events
- Automatic retry on failure

**Core Methods:**
```typescript
class TransferQueue {
  addTransfer(request: TransferRequest): string
  pauseTransfer(transferId: string): void
  resumeTransfer(transferId: string): void
  cancelTransfer(transferId: string): void
  getActiveTransfers(): Transfer[]
}
```

### 3. Create Vault Manager

**File:** `src/main/services/vault/VaultManager.ts`

Security requirements:
- AES-256-GCM encryption
- PBKDF2 key derivation (100,000 iterations)
- Unique salt and IV per credential
- Master password with strength checking
- Auto-lock after timeout
- Secure memory cleanup

**Core Methods:**
```typescript
class VaultManager {
  async unlock(masterPassword: string): Promise<boolean>
  lock(): void
  async addCredential(credential: Credential): Promise<string>
  async getCredential(id: string): Promise<Credential>
  generatePassword(options: PasswordGeneratorOptions): string
}
```

**Storage:** Use electron-store with encryption enabled

### 4. Build Auth Manager

**File:** `src/main/services/auth/AuthManager.ts`

Features:
- SSH key pair generation (RSA, ECDSA, Ed25519)
- Key import/export
- Fingerprint calculation
- Passphrase protection
- Certificate handling

**Core Methods:**
```typescript
class AuthManager {
  generateKeyPair(type: 'rsa' | 'ecdsa' | 'ed25519', bits?: number): Promise<SSHKeyPair>
  importKey(privateKey: string, passphrase?: string): Promise<SSHKeyPair>
  exportKey(keyPair: SSHKeyPair, format: 'openssh' | 'pem'): string
}
```

### 5. Create Connection Manager

**File:** `src/main/services/connection/ConnectionManager.ts`

Features:
- Save/load connection configurations
- Connection grouping/folders
- Recent connections history
- Import/export connections
- Search and filter

**Storage:** electron-store

### 6. Implement Settings Manager

**File:** `src/main/services/settings/SettingsManager.ts`

Settings categories:
- General (startup, updates)
- Appearance (theme, fonts)
- Terminal (colors, cursor)
- Security (auto-lock, clear clipboard)
- Network (timeout, keepalive)

### 7. Create Main Process Entry

**File:** `src/main/index.ts`

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { SSHManager } from './services/ssh/SSHManager';
import { SFTPManager } from './services/sftp/SFTPManager';
import { VaultManager } from './services/vault/VaultManager';
import { setupIPCHandlers } from './ipc-handlers';
import { Logger } from './utils/logger';

const logger = new Logger('Main');

// Service instances
const sshManager = new SSHManager();
const sftpManager = new SFTPManager(sshManager);
const vaultManager = new VaultManager();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    title: 'SecureShell Pro',
    backgroundColor: '#1e1e1e',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  logger.info('App is ready, creating window');

  // Setup IPC handlers
  setupIPCHandlers({
    sshManager,
    sftpManager,
    vaultManager,
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Cleanup
  sshManager.disconnectAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('App is quitting, cleaning up');
  sshManager.disconnectAll();
});
```

### 8. Create IPC Handlers

**File:** `src/main/ipc-handlers.ts`

Set up all IPC communication between main and renderer:

```typescript
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IPCChannels } from '../shared/types/ipc';
import { SSHManager } from './services/ssh/SSHManager';
import { SFTPManager } from './services/sftp/SFTPManager';
import { VaultManager } from './services/vault/VaultManager';

interface Services {
  sshManager: SSHManager;
  sftpManager: SFTPManager;
  vaultManager: VaultManager;
}

export function setupIPCHandlers(services: Services) {
  const { sshManager, sftpManager, vaultManager } = services;

  // SSH Handlers
  ipcMain.handle(IPCChannels.SSH_CONNECT, async (event, config) => {
    try {
      const sessionId = await sshManager.connect(config);
      return { success: true, data: sessionId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SSH_DISCONNECT, async (event, { sessionId }) => {
    try {
      await sshManager.disconnect(sessionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SSH_SEND_DATA, async (event, { sessionId, data }) => {
    try {
      sshManager.sendData(sessionId, data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SSH_RESIZE, async (event, { sessionId, cols, rows }) => {
    try {
      sshManager.resize(sessionId, cols, rows);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // SFTP Handlers
  ipcMain.handle(IPCChannels.SFTP_LIST_DIRECTORY, async (event, { sessionId, path }) => {
    try {
      const entries = await sftpManager.listDirectory(sessionId, path);
      return { success: true, data: entries };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.SFTP_UPLOAD, async (event, request) => {
    try {
      const transfer = await sftpManager.uploadFile(
        request.sessionId,
        request.localPath,
        request.remotePath
      );
      return { success: true, data: transfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Vault Handlers
  ipcMain.handle(IPCChannels.VAULT_UNLOCK, async (event, { masterPassword }) => {
    try {
      const unlocked = await vaultManager.unlock(masterPassword);
      return { success: unlocked };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannels.VAULT_ADD_CREDENTIAL, async (event, { credential }) => {
    try {
      const id = await vaultManager.addCredential(credential);
      return { success: true, data: id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Event forwarding from services to renderer
  sshManager.on('data', (data) => {
    event.sender.send(IPCChannels.EVENT_SSH_DATA, data);
  });

  sshManager.on('status', (status) => {
    event.sender.send(IPCChannels.EVENT_SSH_STATUS, status);
  });

  sftpManager.on('progress', (progress) => {
    event.sender.send(IPCChannels.EVENT_TRANSFER_PROGRESS, progress);
  });

  // Add remaining handlers...
}
```

### 9. Create Preload Script

**File:** `src/preload/index.ts`

Security bridge using contextBridge:

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannels } from '../shared/types/ipc';

// Expose protected methods that renderer can call
contextBridge.exposeInMainWorld('electron', {
  // SSH API
  ssh: {
    connect: (config: any) => ipcRenderer.invoke(IPCChannels.SSH_CONNECT, config),
    disconnect: (sessionId: string) => ipcRenderer.invoke(IPCChannels.SSH_DISCONNECT, { sessionId }),
    sendData: (sessionId: string, data: string) =>
      ipcRenderer.invoke(IPCChannels.SSH_SEND_DATA, { sessionId, data }),
    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.invoke(IPCChannels.SSH_RESIZE, { sessionId, cols, rows }),
    onData: (callback: (data: any) => void) => {
      ipcRenderer.on(IPCChannels.EVENT_SSH_DATA, (event, data) => callback(data));
    },
    onStatus: (callback: (status: any) => void) => {
      ipcRenderer.on(IPCChannels.EVENT_SSH_STATUS, (event, status) => callback(status));
    },
  },

  // SFTP API
  sftp: {
    listDirectory: (sessionId: string, path: string) =>
      ipcRenderer.invoke(IPCChannels.SFTP_LIST_DIRECTORY, { sessionId, path }),
    upload: (request: any) => ipcRenderer.invoke(IPCChannels.SFTP_UPLOAD, request),
    download: (request: any) => ipcRenderer.invoke(IPCChannels.SFTP_DOWNLOAD, request),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on(IPCChannels.EVENT_TRANSFER_PROGRESS, (event, progress) => callback(progress));
    },
  },

  // Vault API
  vault: {
    unlock: (masterPassword: string) =>
      ipcRenderer.invoke(IPCChannels.VAULT_UNLOCK, { masterPassword }),
    lock: () => ipcRenderer.invoke(IPCChannels.VAULT_LOCK),
    addCredential: (credential: any) =>
      ipcRenderer.invoke(IPCChannels.VAULT_ADD_CREDENTIAL, { credential }),
    getCredential: (id: string) =>
      ipcRenderer.invoke(IPCChannels.VAULT_GET_CREDENTIAL, { id }),
    listCredentials: () =>
      ipcRenderer.invoke(IPCChannels.VAULT_LIST_CREDENTIALS),
  },
});

// Type definitions for window.electron
declare global {
  interface Window {
    electron: {
      ssh: { /* ... */ };
      sftp: { /* ... */ };
      vault: { /* ... */ };
    };
  }
}
```

### 10. Create React Application

**File:** `src/renderer/index.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**File:** `src/renderer/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
  <title>SecureShell Pro</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

**File:** `src/renderer/App.tsx`

```typescript
import React, { useState } from 'react';
import { MainView } from './views/MainView';
import { WelcomeView } from './views/WelcomeView';

export const App: React.FC = () => {
  const [hasConnection, setHasConnection] = useState(false);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {hasConnection ? (
        <MainView />
      ) : (
        <WelcomeView onConnect={() => setHasConnection(true)} />
      )}
    </div>
  );
};
```

### 11. Create Terminal Component

**File:** `src/renderer/components/terminal/Terminal.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  sessionId: string;
}

export const Terminal: React.FC<TerminalProps> = ({ sessionId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Send input to SSH
    term.onData((data) => {
      window.electron.ssh.sendData(sessionId, data);
    });

    // Receive output from SSH
    const unsubscribe = window.electron.ssh.onData((event) => {
      if (event.sessionId === sessionId) {
        term.write(event.data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      window.electron.ssh.resize(sessionId, term.cols, term.rows);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, [sessionId]);

  return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
};
```

### 12. Create Custom Hooks

**File:** `src/renderer/hooks/useSSH.ts`

```typescript
import { useState, useCallback } from 'react';
import { SSHConnectionConfig } from '@shared/types/ssh';

export function useSSH() {
  const [sessions, setSessions] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (config: SSHConnectionConfig) => {
    setConnecting(true);
    setError(null);

    try {
      const response = await window.electron.ssh.connect(config);

      if (response.success) {
        setSessions(prev => [...prev, response.data]);
        return response.data;
      } else {
        setError(response.error || 'Connection failed');
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async (sessionId: string) => {
    try {
      await window.electron.ssh.disconnect(sessionId);
      setSessions(prev => prev.filter(id => id !== sessionId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  return {
    sessions,
    connecting,
    error,
    connect,
    disconnect,
  };
}
```

### 13. Create Zustand Stores

**File:** `src/renderer/store/sshStore.ts`

```typescript
import { create } from 'zustand';
import { SSHSession } from '@shared/types/ssh';

interface SSHStore {
  sessions: Map<string, SSHSession>;
  activeSessionId: string | null;
  addSession: (session: SSHSession) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  getSession: (id: string) => SSHSession | undefined;
}

export const useSSHStore = create<SSHStore>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,

  addSession: (session) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.set(session.id, session);
      return { sessions: newSessions };
    }),

  removeSession: (id) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.delete(id);
      return {
        sessions: newSessions,
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
      };
    }),

  setActiveSession: (id) => set({ activeSessionId: id }),

  getSession: (id) => get().sessions.get(id),
}));
```

### 14. File Browser Component

**File:** `src/renderer/components/sftp/FileExplorer.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { FileEntry } from '@shared/types/sftp';

interface FileExplorerProps {
  sessionId: string;
  type: 'local' | 'remote';
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ sessionId, type }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, sessionId]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const response = await window.electron.sftp.listDirectory(sessionId, path);
      if (response.success) {
        setFiles(response.data);
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDoubleClick = (file: FileEntry) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
        <input
          type="text"
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Modified</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.path}
                  onDoubleClick={() => handleFileDoubleClick(file)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{file.name}</td>
                  <td>{file.type === 'file' ? file.size : '--'}</td>
                  <td>{new Date(file.modifyTime).toLocaleString()}</td>
                  <td>{file.permissions.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
```

## Testing

### Unit Test Example

**File:** `tests/unit/main/services/ssh/SSHManager.test.ts`

```typescript
import { SSHManager } from '../../../../../src/main/services/ssh/SSHManager';

describe('SSHManager', () => {
  let sshManager: SSHManager;

  beforeEach(() => {
    sshManager = new SSHManager();
  });

  afterEach(() => {
    sshManager.disconnectAll();
  });

  describe('connect', () => {
    it('should establish SSH connection', async () => {
      const config = {
        host: 'test.example.com',
        port: 22,
        username: 'testuser',
        password: 'testpass',
        authMethod: 'password' as const,
      };

      const sessionId = await sshManager.connect(config);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
    });

    it('should emit status event on connection', (done) => {
      sshManager.on('status', (event) => {
        expect(event.status).toBe('connected');
        done();
      });

      // Connect...
    });
  });
});
```

## Build and Package

### Jest Configuration

**File:** `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '@main/(.*)': '<rootDir>/src/main/$1',
    '@renderer/(.*)': '<rootDir>/src/renderer/$1',
    '@shared/(.*)': '<rootDir>/src/shared/$1',
  },
};
```

### Build for Production

```bash
npm run build
npm run package
```

## Next Implementation Priority

1. ✅ SSH Manager - Complete
2. ✅ Logger - Complete
3. 🔄 SFTP Manager with Transfer Queue
4. 🔄 Vault Manager with encryption
5. Auth Manager (key generation)
6. Main process entry and IPC handlers
7. Preload script
8. React components (Terminal, File Browser)
9. Integration and testing

## Common Patterns

### Error Handling

```typescript
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error: any) {
  logger.error('Operation failed:', error);
  return { success: false, error: error.message };
}
```

### Event Emission

```typescript
this.emit('eventName', {
  id: 'some-id',
  data: payload,
});
```

### IPC Communication

```typescript
// Main Process
ipcMain.handle('channel:name', async (event, arg) => {
  return await doSomething(arg);
});

// Renderer Process
const result = await window.electron.api.doSomething(arg);
```

## Security Checklist

- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Sandbox enabled
- ✅ Secure preload bridge
- ✅ Content Security Policy
- ✅ No eval() usage
- ✅ Input validation
- ✅ Encrypted credential storage
- ✅ Secure memory handling

---

This guide provides the blueprint for completing SecureShell Pro. Follow the numbered steps in order, implementing each component with the patterns and examples provided.
