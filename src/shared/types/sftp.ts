export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink' | 'special';
  size: number;
  modifyTime: Date;
  accessTime: Date;
  permissions: FilePermissions;
  owner: string;
  group: string;
  target?: string; // For symlinks
}

export interface FilePermissions {
  user: PermissionSet;
  group: PermissionSet;
  others: PermissionSet;
  mode: string; // Octal representation (e.g., '755')
}

export interface PermissionSet {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface Transfer {
  id: string;
  type: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  filename: string;
  size: number;
  transferred: number;
  status: TransferStatus;
  speed: number; // bytes per second
  startTime: Date;
  endTime?: Date;
  error?: string;
  priority: number;
  sessionId: string;
}

export type TransferStatus =
  | 'queued'
  | 'transferring'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TransferProgress {
  transferId: string;
  transferred: number;
  percentage: number;
  speed: number;
  estimatedTimeRemaining?: number;
}

export interface TransferRequest {
  type: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  sessionId: string;
  priority?: number;
}

export interface DirectoryListing {
  path: string;
  entries: FileEntry[];
}

export interface FileOperation {
  type: 'create' | 'delete' | 'rename' | 'chmod' | 'mkdir' | 'rmdir';
  path: string;
  newPath?: string; // For rename
  mode?: string; // For chmod
}
