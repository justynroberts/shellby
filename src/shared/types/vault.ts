export interface Credential {
  id: string;
  name: string;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialSummary {
  id: string;
  name: string;
  username: string;
  tags: string[];
  updatedAt: Date;
}

export interface VaultConfig {
  autoLockTimeout: number; // in minutes, 0 = never
  requirePasswordOnStart: boolean;
  clipboardClearTimeout: number; // in seconds
  showPasswordStrength: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  crackTime: string;
}

export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}

export interface VaultStatus {
  isLocked: boolean;
  lastUnlockTime?: Date;
  credentialCount: number;
}
