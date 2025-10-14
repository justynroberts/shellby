export interface SSHConnectionConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string | Buffer;
  passphrase?: string;
  authMethod: 'password' | 'publickey' | 'keyboard-interactive';
  keepaliveInterval?: number;
  keepaliveCountMax?: number;
  readyTimeout?: number;
  jumpHost?: SSHConnectionConfig;
}

export interface SSHSession {
  id: string;
  config: SSHConnectionConfig;
  status: SSHConnectionStatus;
  createdAt: Date;
  connectedAt?: Date;
  lastActivity: Date;
  terminalCols: number;
  terminalRows: number;
}

export type SSHConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'error';

export interface SSHDataEvent {
  sessionId: string;
  data: string;
}

export interface SSHResizeEvent {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface SSHErrorEvent {
  sessionId: string;
  error: string;
  code?: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SSHKeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  type: 'rsa' | 'ecdsa' | 'ed25519';
}
