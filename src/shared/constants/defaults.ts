import { SSHConnectionConfig } from '../types/ssh';
import { VaultConfig } from '../types/vault';
import { PasswordGeneratorOptions } from '../types/vault';

export const DEFAULT_SSH_CONFIG: Partial<SSHConnectionConfig> = {
  port: 22,
  keepaliveInterval: 10000,
  keepaliveCountMax: 3,
  readyTimeout: 20000,
  authMethod: 'password',
};

export const DEFAULT_TERMINAL_CONFIG = {
  cols: 80,
  rows: 24,
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  cursorBlink: true,
  cursorStyle: 'block' as const,
  scrollback: 1000,
};

export const DEFAULT_VAULT_CONFIG: VaultConfig = {
  autoLockTimeout: 15, // 15 minutes
  requirePasswordOnStart: true,
  clipboardClearTimeout: 30, // 30 seconds
  showPasswordStrength: true,
};

export const DEFAULT_PASSWORD_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: true,
  excludeAmbiguous: true,
};

export const TRANSFER_CHUNK_SIZE = 32768; // 32KB chunks
export const MAX_CONCURRENT_TRANSFERS = 3;
export const TRANSFER_RETRY_ATTEMPTS = 3;

export const SSH_CIPHER_PREFERENCES = [
  'aes256-gcm@openssh.com',
  'aes256-ctr',
  'aes192-ctr',
  'aes128-gcm@openssh.com',
  'aes128-ctr',
];

export const SSH_KEX_PREFERENCES = [
  'curve25519-sha256',
  'curve25519-sha256@libssh.org',
  'ecdh-sha2-nistp256',
  'ecdh-sha2-nistp384',
  'ecdh-sha2-nistp521',
  'diffie-hellman-group14-sha256',
];

export const SSH_MAC_PREFERENCES = [
  'hmac-sha2-512-etm@openssh.com',
  'hmac-sha2-256-etm@openssh.com',
  'hmac-sha2-512',
  'hmac-sha2-256',
];

export const APP_NAME = 'SecureShell Pro';
export const APP_VERSION = '1.0.0';
