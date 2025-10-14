import { SSHConnectionConfig, SSHSession, CommandResult, SSHKeyPair } from './ssh';
import {
  FileEntry,
  Transfer,
  TransferRequest,
  TransferProgress,
  FileOperation,
} from './sftp';
import {
  Credential,
  CredentialSummary,
  VaultStatus,
  PasswordGeneratorOptions,
  PasswordStrength,
} from './vault';

// IPC Channel names
export enum IPCChannels {
  // SSH
  SSH_CONNECT = 'ssh:connect',
  SSH_DISCONNECT = 'ssh:disconnect',
  SSH_SEND_DATA = 'ssh:send-data',
  SSH_RESIZE = 'ssh:resize',
  SSH_EXECUTE_COMMAND = 'ssh:execute-command',
  SSH_GET_SESSIONS = 'ssh:get-sessions',

  // SFTP
  SFTP_INIT = 'sftp:init',
  SFTP_LIST_DIRECTORY = 'sftp:list-directory',
  SFTP_UPLOAD = 'sftp:upload',
  SFTP_DOWNLOAD = 'sftp:download',
  SFTP_UPLOAD_DIRECTORY = 'sftp:upload-directory',
  SFTP_DOWNLOAD_DIRECTORY = 'sftp:download-directory',
  SFTP_DELETE = 'sftp:delete',
  SFTP_RENAME = 'sftp:rename',
  SFTP_MKDIR = 'sftp:mkdir',
  SFTP_RMDIR = 'sftp:rmdir',
  SFTP_CHMOD = 'sftp:chmod',
  SFTP_GET_TRANSFERS = 'sftp:get-transfers',
  SFTP_PAUSE_TRANSFER = 'sftp:pause-transfer',
  SFTP_RESUME_TRANSFER = 'sftp:resume-transfer',
  SFTP_CANCEL_TRANSFER = 'sftp:cancel-transfer',

  // Local Filesystem
  FS_LIST_DIRECTORY = 'fs:list-directory',
  FS_GET_HOME = 'fs:get-home',

  // AI Assistant
  AI_GET_SETTINGS = 'ai:get-settings',
  AI_UPDATE_SETTINGS = 'ai:update-settings',
  AI_GENERATE_COMMAND = 'ai:generate-command',
  AI_EXPLAIN_ERROR = 'ai:explain-error',
  AI_ANALYZE_LOGS = 'ai:analyze-logs',
  AI_CHAT = 'ai:chat',
  AI_GENERATE_SCRIPT = 'ai:generate-script',

  // Snippets
  SNIPPET_GET_ALL = 'snippet:get-all',
  SNIPPET_GET = 'snippet:get',
  SNIPPET_CREATE = 'snippet:create',
  SNIPPET_UPDATE = 'snippet:update',
  SNIPPET_DELETE = 'snippet:delete',
  SNIPPET_SEARCH = 'snippet:search',
  SNIPPET_GET_BY_CATEGORY = 'snippet:get-by-category',
  SNIPPET_GET_MOST_USED = 'snippet:get-most-used',
  SNIPPET_INCREMENT_USAGE = 'snippet:increment-usage',
  SNIPPET_TOGGLE_FAVORITE = 'snippet:toggle-favorite',
  SNIPPET_GET_FAVORITES = 'snippet:get-favorites',

  // Vault
  VAULT_UNLOCK = 'vault:unlock',
  VAULT_LOCK = 'vault:lock',
  VAULT_IS_LOCKED = 'vault:is-locked',
  VAULT_GET_STATUS = 'vault:get-status',
  VAULT_ADD_CREDENTIAL = 'vault:add-credential',
  VAULT_UPDATE_CREDENTIAL = 'vault:update-credential',
  VAULT_DELETE_CREDENTIAL = 'vault:delete-credential',
  VAULT_GET_CREDENTIAL = 'vault:get-credential',
  VAULT_LIST_CREDENTIALS = 'vault:list-credentials',
  VAULT_GENERATE_PASSWORD = 'vault:generate-password',
  VAULT_CHECK_STRENGTH = 'vault:check-strength',
  VAULT_IMPORT = 'vault:import',
  VAULT_EXPORT = 'vault:export',

  // Auth
  AUTH_GENERATE_KEYPAIR = 'auth:generate-keypair',
  AUTH_IMPORT_KEY = 'auth:import-key',
  AUTH_EXPORT_KEY = 'auth:export-key',

  // Connection Management
  CONNECTION_SAVE = 'connection:save',
  CONNECTION_DELETE = 'connection:delete',
  CONNECTION_GET = 'connection:get',
  CONNECTION_LIST = 'connection:list',
  CONNECTION_IMPORT = 'connection:import',
  CONNECTION_EXPORT = 'connection:export',

  // Settings
  SETTINGS_GET = 'settings:get',
  SETTINGS_SET = 'settings:set',
  SETTINGS_RESET = 'settings:reset',

  // Clipboard
  CLIPBOARD_COPY = 'clipboard:copy',
  CLIPBOARD_PASTE = 'clipboard:paste',
  CLIPBOARD_GET_HISTORY = 'clipboard:get-history',
  CLIPBOARD_COPY_FROM_HISTORY = 'clipboard:copy-from-history',
  CLIPBOARD_DELETE_ENTRY = 'clipboard:delete-entry',
  CLIPBOARD_CLEAR_HISTORY = 'clipboard:clear-history',
  CLIPBOARD_CLEAR = 'clipboard:clear',
  CLIPBOARD_SEARCH = 'clipboard:search',

  // Events (Main -> Renderer)
  EVENT_SSH_DATA = 'event:ssh:data',
  EVENT_SSH_STATUS = 'event:ssh:status',
  EVENT_SSH_ERROR = 'event:ssh:error',
  EVENT_TRANSFER_PROGRESS = 'event:transfer:progress',
  EVENT_TRANSFER_STATUS = 'event:transfer:status',
  EVENT_VAULT_LOCKED = 'event:vault:locked',
  EVENT_ERROR = 'event:error',
  EVENT_LOG = 'event:log',
}

// Request/Response Types
export interface IPCRequest<T = any> {
  channel: IPCChannels;
  data: T;
}

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Specific request types
export interface SSHConnectRequest {
  config: SSHConnectionConfig;
}

export interface SSHDisconnectRequest {
  sessionId: string;
}

export interface SSHSendDataRequest {
  sessionId: string;
  data: string;
}

export interface SSHResizeRequest {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface SSHExecuteCommandRequest {
  sessionId: string;
  command: string;
}

export interface SFTPListDirectoryRequest {
  sessionId: string;
  path: string;
}

export interface SFTPTransferRequest extends TransferRequest {}

export interface SFTPFileOperationRequest extends FileOperation {
  sessionId: string;
}

export interface VaultUnlockRequest {
  masterPassword: string;
}

export interface VaultAddCredentialRequest {
  credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface VaultUpdateCredentialRequest {
  id: string;
  credential: Partial<Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>>;
}

// Response types
export interface SSHConnectResponse {
  sessionId: string;
  session: SSHSession;
}

export interface SFTPListDirectoryResponse {
  entries: FileEntry[];
}

export interface TransferResponse {
  transferId: string;
  transfer: Transfer;
}

export interface VaultCredentialResponse {
  credential: Credential;
}

export interface VaultListResponse {
  credentials: CredentialSummary[];
}

export interface PasswordGenerateResponse {
  password: string;
  strength: PasswordStrength;
}

export interface KeyPairGenerateResponse {
  keyPair: SSHKeyPair;
}

// Event types
export interface SSHDataEvent {
  sessionId: string;
  data: Buffer | string;
}

export interface SSHStatusEvent {
  sessionId: string;
  status: string;
}

export interface SSHErrorEvent {
  sessionId: string;
  error: string;
}

export interface TransferProgressEvent {
  progress: TransferProgress;
}

export interface TransferStatusEvent {
  transferId: string;
  status: string;
  error?: string;
}

export interface ErrorEvent {
  message: string;
  code?: string;
  details?: any;
}

export interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

// Clipboard request/response types
export interface ClipboardCopyRequest {
  text: string;
  source?: 'terminal' | 'manual';
}

export interface ClipboardSearchRequest {
  query: string;
}
