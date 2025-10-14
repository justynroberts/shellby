# SecureShell Pro - Technical Architecture

## System Overview

SecureShell Pro is built using Electron with a React frontend and Node.js backend. The application follows a secure architecture pattern with clear separation between the main process (privileged) and renderer process (sandboxed).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Renderer Process                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React Application                       │   │
│  │  ┌──────────┬──────────┬───────────┬──────────┐    │   │
│  │  │ Terminal │   SFTP   │  Vault    │ Settings │    │   │
│  │  │   View   │   View   │   View    │   View   │    │   │
│  │  └──────────┴──────────┴───────────┴──────────┘    │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         State Management (Zustand)           │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                    IPC Communication                         │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                     Main Process                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Service Layer                          │   │
│  │  ┌────────────┬────────────┬──────────────────┐    │   │
│  │  │    SSH     │    SFTP    │  Vault Manager   │    │   │
│  │  │  Manager   │  Manager   │  (AES-256)       │    │   │
│  │  └────────────┴────────────┴──────────────────┘    │   │
│  │  ┌────────────┬────────────┬──────────────────┐    │   │
│  │  │ Connection │  Transfer  │    Settings      │    │   │
│  │  │  Manager   │   Queue    │    Manager       │    │   │
│  │  └────────────┴────────────┴──────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Core Libraries                           │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │  ssh2  │ node-forge │  electron-store     │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
secureshell-pro/
├── src/
│   ├── main/                      # Main process code
│   │   ├── index.ts              # Main entry point
│   │   ├── ipc-handlers.ts       # IPC message handlers
│   │   ├── menu.ts               # Application menu
│   │   ├── services/
│   │   │   ├── ssh/
│   │   │   │   ├── SSHManager.ts        # SSH connection management
│   │   │   │   ├── SSHClient.ts         # Individual SSH client
│   │   │   │   └── types.ts             # SSH types
│   │   │   ├── sftp/
│   │   │   │   ├── SFTPManager.ts       # SFTP operations
│   │   │   │   ├── TransferQueue.ts     # File transfer queue
│   │   │   │   └── types.ts             # SFTP types
│   │   │   ├── vault/
│   │   │   │   ├── VaultManager.ts      # Password vault
│   │   │   │   ├── Encryption.ts        # AES encryption
│   │   │   │   └── types.ts             # Vault types
│   │   │   ├── auth/
│   │   │   │   ├── AuthManager.ts       # Authentication
│   │   │   │   ├── KeyGenerator.ts      # SSH key generation
│   │   │   │   └── types.ts             # Auth types
│   │   │   ├── connection/
│   │   │   │   ├── ConnectionManager.ts # Connection bookmarks
│   │   │   │   └── types.ts             # Connection types
│   │   │   └── settings/
│   │   │       ├── SettingsManager.ts   # App settings
│   │   │       └── types.ts             # Settings types
│   │   └── utils/
│   │       ├── logger.ts         # Logging utility
│   │       └── security.ts       # Security utilities
│   │
│   ├── renderer/                  # Renderer process code
│   │   ├── index.tsx             # Renderer entry point
│   │   ├── App.tsx               # Root component
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── terminal/
│   │   │   │   ├── Terminal.tsx         # Terminal component
│   │   │   │   ├── TerminalTab.tsx      # Terminal tab
│   │   │   │   └── CommandHistory.tsx   # History panel
│   │   │   ├── sftp/
│   │   │   │   ├── FileExplorer.tsx     # File browser
│   │   │   │   ├── FileList.tsx         # File list view
│   │   │   │   ├── FileItem.tsx         # Individual file
│   │   │   │   ├── DualPane.tsx         # Dual-pane view
│   │   │   │   ├── TransferQueue.tsx    # Transfer queue UI
│   │   │   │   └── ProgressBar.tsx      # Transfer progress
│   │   │   ├── vault/
│   │   │   │   ├── VaultUnlock.tsx      # Master password
│   │   │   │   ├── CredentialList.tsx   # Saved credentials
│   │   │   │   ├── CredentialForm.tsx   # Add/edit credentials
│   │   │   │   └── PasswordGenerator.tsx # Password generator
│   │   │   ├── connections/
│   │   │   │   ├── ConnectionList.tsx   # Saved connections
│   │   │   │   ├── QuickConnect.tsx     # Quick connect form
│   │   │   │   ├── ConnectionForm.tsx   # Connection editor
│   │   │   │   └── ConnectionGroups.tsx # Groups/folders
│   │   │   └── settings/
│   │   │       ├── SettingsPanel.tsx    # Settings UI
│   │   │       ├── GeneralSettings.tsx
│   │   │       ├── SecuritySettings.tsx
│   │   │       └── AppearanceSettings.tsx
│   │   ├── views/
│   │   │   ├── MainView.tsx      # Main application view
│   │   │   ├── WelcomeView.tsx   # Welcome screen
│   │   │   └── AboutView.tsx     # About dialog
│   │   ├── hooks/
│   │   │   ├── useSSH.ts         # SSH hook
│   │   │   ├── useSFTP.ts        # SFTP hook
│   │   │   ├── useVault.ts       # Vault hook
│   │   │   └── useSettings.ts    # Settings hook
│   │   ├── store/
│   │   │   ├── index.ts          # Store configuration
│   │   │   ├── sshStore.ts       # SSH state
│   │   │   ├── sftpStore.ts      # SFTP state
│   │   │   ├── vaultStore.ts     # Vault state
│   │   │   └── settingsStore.ts  # Settings state
│   │   ├── styles/
│   │   │   ├── global.css        # Global styles
│   │   │   ├── themes/
│   │   │   │   ├── dark.ts       # Dark theme
│   │   │   │   └── light.ts      # Light theme
│   │   │   └── variables.css     # CSS variables
│   │   └── utils/
│   │       ├── ipc.ts            # IPC helpers
│   │       ├── formatters.ts     # Formatting utilities
│   │       └── validators.ts     # Input validation
│   │
│   ├── preload/
│   │   └── index.ts              # Preload script (context bridge)
│   │
│   └── shared/
│       ├── types/
│       │   ├── ssh.ts            # Shared SSH types
│       │   ├── sftp.ts           # Shared SFTP types
│       │   ├── vault.ts          # Shared vault types
│       │   └── ipc.ts            # IPC channel definitions
│       ├── constants/
│       │   ├── channels.ts       # IPC channel names
│       │   └── defaults.ts       # Default values
│       └── utils/
│           └── crypto.ts         # Shared crypto utilities
│
├── assets/
│   ├── icons/                    # Application icons
│   ├── images/                   # UI images
│   └── fonts/                    # Custom fonts
│
├── tests/
│   ├── unit/                     # Unit tests
│   │   ├── main/
│   │   └── renderer/
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
│
├── docs/
│   ├── user-guide/               # User documentation
│   ├── developer/                # Developer docs
│   └── api/                      # API documentation
│
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.renderer.json
├── webpack.config.js
├── forge.config.js
└── README.md
```

## Core Components

### 1. SSH Manager (Main Process)

**Responsibilities:**
- Create and manage SSH connections
- Handle authentication (password, keys, certificates)
- Maintain connection pool
- Process terminal I/O
- Execute remote commands

**Key Methods:**
```typescript
class SSHManager {
  connect(config: SSHConnectionConfig): Promise<string>
  disconnect(sessionId: string): Promise<void>
  sendData(sessionId: string, data: string): void
  resize(sessionId: string, cols: number, rows: number): void
  executeCommand(sessionId: string, command: string): Promise<CommandResult>
}
```

### 2. SFTP Manager (Main Process)

**Responsibilities:**
- SFTP session management
- File operations (list, upload, download, delete, rename)
- Directory operations
- Permission management
- Transfer queue coordination

**Key Methods:**
```typescript
class SFTPManager {
  listDirectory(sessionId: string, path: string): Promise<FileEntry[]>
  uploadFile(sessionId: string, local: string, remote: string): Promise<TransferId>
  downloadFile(sessionId: string, remote: string, local: string): Promise<TransferId>
  deleteFile(sessionId: string, path: string): Promise<void>
  createDirectory(sessionId: string, path: string): Promise<void>
  setPermissions(sessionId: string, path: string, mode: string): Promise<void>
}
```

### 3. Vault Manager (Main Process)

**Responsibilities:**
- Encrypt/decrypt credentials
- Master password management
- Secure storage of passwords and keys
- Credential CRUD operations
- Auto-lock functionality

**Key Methods:**
```typescript
class VaultManager {
  unlock(masterPassword: string): Promise<boolean>
  lock(): void
  addCredential(credential: Credential): Promise<string>
  getCredential(id: string): Promise<Credential>
  updateCredential(id: string, credential: Credential): Promise<void>
  deleteCredential(id: string): Promise<void>
  listCredentials(): Promise<CredentialSummary[]>
  generatePassword(options: PasswordOptions): string
}
```

### 4. Transfer Queue (Main Process)

**Responsibilities:**
- Queue file transfers
- Prioritize transfers
- Pause/resume functionality
- Progress tracking
- Concurrent transfer management

**Key Methods:**
```typescript
class TransferQueue {
  addTransfer(transfer: TransferRequest): string
  pauseTransfer(transferId: string): void
  resumeTransfer(transferId: string): void
  cancelTransfer(transferId: string): void
  getTransferStatus(transferId: string): TransferStatus
  setPriority(transferId: string, priority: number): void
}
```

## Security Architecture

### Encryption Strategy

**Password Vault:**
- Master password → PBKDF2 (100,000 iterations) → Key Derivation
- AES-256-GCM encryption for all stored credentials
- Salt and IV unique per credential
- No plain-text credential storage

**Configuration:**
- Encrypted configuration files (electron-store with encryption)
- Secure key storage using OS keychain where available
- Memory protection for sensitive data

### IPC Security

**Context Isolation:**
- Renderer process fully sandboxed
- No Node.js access in renderer
- All communication through secure IPC channels
- Input validation on all IPC messages

**Content Security Policy:**
```typescript
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "font-src 'self'",
  "object-src 'none'"
].join('; ');
```

### SSH Security

- SSH-2 protocol only
- Strong cipher preferences (AES-256, ChaCha20)
- Strong MAC algorithms (HMAC-SHA2-256/512)
- Strong key exchange (curve25519, ecdh-sha2-nistp256)
- Host key verification
- Known hosts management

## State Management

### Zustand Stores

**SSH Store:**
```typescript
interface SSHStore {
  sessions: Map<string, SSHSession>
  activeSessionId: string | null
  addSession: (session: SSHSession) => void
  removeSession: (id: string) => void
  setActiveSession: (id: string) => void
  updateSessionData: (id: string, data: string) => void
}
```

**SFTP Store:**
```typescript
interface SFTPStore {
  currentPath: { local: string, remote: string }
  files: { local: FileEntry[], remote: FileEntry[] }
  transfers: Transfer[]
  selectedFiles: string[]
  setPath: (type: 'local' | 'remote', path: string) => void
  refreshFiles: (type: 'local' | 'remote') => void
  selectFile: (path: string) => void
}
```

## IPC Communication

### Channel Definitions

```typescript
enum IPCChannels {
  // SSH
  SSH_CONNECT = 'ssh:connect',
  SSH_DISCONNECT = 'ssh:disconnect',
  SSH_DATA = 'ssh:data',
  SSH_RESIZE = 'ssh:resize',

  // SFTP
  SFTP_LIST = 'sftp:list',
  SFTP_UPLOAD = 'sftp:upload',
  SFTP_DOWNLOAD = 'sftp:download',
  SFTP_DELETE = 'sftp:delete',

  // Vault
  VAULT_UNLOCK = 'vault:unlock',
  VAULT_LOCK = 'vault:lock',
  VAULT_ADD = 'vault:add',
  VAULT_GET = 'vault:get',

  // Events
  EVENT_TRANSFER_PROGRESS = 'event:transfer:progress',
  EVENT_CONNECTION_STATUS = 'event:connection:status',
  EVENT_ERROR = 'event:error'
}
```

## Performance Optimization

### Strategies

1. **Lazy Loading:**
   - Load components on demand
   - Virtualized lists for large file directories
   - Code splitting for different views

2. **Worker Threads:**
   - Encryption/decryption in worker threads
   - File hashing in background

3. **Caching:**
   - Directory listing cache with TTL
   - Connection configuration cache
   - Theme and settings cache

4. **Efficient Rendering:**
   - React.memo for expensive components
   - Debounced search and filters
   - Virtual scrolling for terminal output

## Testing Strategy

### Unit Tests
- Service layer: 80%+ coverage
- Utility functions: 90%+ coverage
- React components: 70%+ coverage

### Integration Tests
- SSH connection flow
- SFTP operations
- Vault unlock/lock
- File transfers

### E2E Tests
- Complete user workflows
- Connection management
- File transfer scenarios
- Security features

## Build & Deployment

### Build Process

```bash
npm run build          # Build renderer and main
npm run package        # Package with Electron Forge
npm run make          # Create distributable
```

### Code Signing
- Windows code signing with DigiCert/Sectigo
- Timestamp signing for long-term validity

### Auto-Updates
- Electron-updater with signature verification
- Delta updates for smaller downloads
- Update channels: stable, beta

## Monitoring & Logging

### Logging Levels
- ERROR: Critical errors
- WARN: Warnings and recoverable errors
- INFO: General information
- DEBUG: Detailed debugging (dev only)

### Log Locations
- Windows: `%APPDATA%/SecureShellPro/logs/`
- Rotate logs daily, keep 7 days
- Sanitize sensitive information

### Crash Reporting
- Opt-in crash reporting
- Anonymized error reports
- Stack traces without sensitive data

## Dependencies

### Core Dependencies
```json
{
  "electron": "^27.0.0",
  "react": "^18.2.0",
  "ssh2": "^1.15.0",
  "xterm": "^5.3.0",
  "zustand": "^4.4.0",
  "node-forge": "^1.3.1",
  "electron-store": "^8.1.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.2.0",
  "@electron-forge/cli": "^7.0.0",
  "webpack": "^5.88.0",
  "jest": "^29.6.0",
  "playwright": "^1.38.0"
}
```

## Scalability Considerations

- Support for 50+ simultaneous connections
- Efficient memory management for long-running sessions
- Connection pooling for reuse
- Graceful degradation under load

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- High contrast themes
- Screen reader compatibility
- Configurable font sizes

---

**Document Version:** 1.0
**Last Updated:** 2025-10-11
