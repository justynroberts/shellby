import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Home,
  ArrowLeft,
  Eye,
  EyeOff,
  Search,
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  Database,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Monitor,
  Server,
  X,
} from 'lucide-react';
import { FileEntry, Transfer } from '../../../shared/types/sftp';
import { TransferQueue } from './TransferQueue';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';

interface FileManagerProps {
  sessionId: string | null;
  onClose: () => void;
}

type SortColumn = 'name' | 'size' | 'modified';
type SortDirection = 'asc' | 'desc';

export const FileManager: React.FC<FileManagerProps> = ({ sessionId, onClose }) => {
  const [localPath, setLocalPath] = useState<string>('');
  const [remotePath, setRemotePath] = useState<string>('/');
  const [localFiles, setLocalFiles] = useState<FileEntry[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<FileEntry[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<Set<string>>(new Set());
  const [selectedRemote, setSelectedRemote] = useState<Set<string>>(new Set());
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedFile, setDraggedFile] = useState<{ file: FileEntry; source: 'local' | 'remote' } | null>(null);

  // New state for enhanced UX
  const [localSortColumn, setLocalSortColumn] = useState<SortColumn>('name');
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>('asc');
  const [remoteSortColumn, setRemoteSortColumn] = useState<SortColumn>('name');
  const [remoteSortDirection, setRemoteSortDirection] = useState<SortDirection>('asc');
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [localFilter, setLocalFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState('');
  const [hoveredLocalRow, setHoveredLocalRow] = useState<string | null>(null);
  const [hoveredRemoteRow, setHoveredRemoteRow] = useState<string | null>(null);
  const [lastSelectedLocal, setLastSelectedLocal] = useState<string | null>(null);
  const [lastSelectedRemote, setLastSelectedRemote] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
  } | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Get local home directory
        const homeResult = await window.electron.fs.getHome();
        if (homeResult.success) {
          setLocalPath(homeResult.data);
          await loadLocalDirectory(homeResult.data);
        }

        // Initialize SFTP if session exists
        if (sessionId) {
          await window.electron.sftp.init(sessionId);
          await loadRemoteDirectory('/');
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    init();
  }, [sessionId]);

  // Setup transfer event listeners
  useEffect(() => {
    const unsubProgress = window.electron.sftp.onTransferProgress((progress: any) => {
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === progress.transferId
            ? {
                ...t,
                transferred: progress.transferred,
                speed: progress.speed,
              }
            : t
        )
      );
    });

    const unsubStatus = window.electron.sftp.onTransferStatus((status: any) => {
      if (status.status === 'completed' || status.status === 'failed') {
        setTransfers((prev) => prev.filter((t) => t.id !== status.transferId));
        // Refresh directories after transfer
        if (status.status === 'completed') {
          loadLocalDirectory(localPath);
          loadRemoteDirectory(remotePath);
        }
      }
    });

    return () => {
      unsubProgress();
      unsubStatus();
    };
  }, [localPath, remotePath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: Close File Manager
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (document.activeElement?.closest('[data-pane="local"]')) {
          setSelectedLocal(new Set(getFilteredAndSortedFiles(localFiles, localFilter, localSortColumn, localSortDirection, showHiddenFiles).map(f => f.path)));
        } else if (document.activeElement?.closest('[data-pane="remote"]')) {
          setSelectedRemote(new Set(getFilteredAndSortedFiles(remoteFiles, remoteFilter, remoteSortColumn, remoteSortDirection, showHiddenFiles).map(f => f.path)));
        }
      }

      // Ctrl/Cmd + D: Deselect all
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setSelectedLocal(new Set());
        setSelectedRemote(new Set());
      }

      // Ctrl/Cmd + R: Refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadLocalDirectory(localPath);
        loadRemoteDirectory(remotePath);
      }

      // Ctrl/Cmd + H: Toggle hidden files
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHiddenFiles(prev => !prev);
      }

      // Backspace: Navigate up
      if (e.key === 'Backspace' && !(e.target as HTMLElement).matches('input')) {
        e.preventDefault();
        if (document.activeElement?.closest('[data-pane="local"]')) {
          navigateLocalUp();
        } else if (document.activeElement?.closest('[data-pane="remote"]')) {
          navigateRemoteUp();
        }
      }

      // Delete: Delete selected
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedRemote.size > 0) {
          setConfirmDialog({
            title: 'Delete Files',
            message: `Are you sure you want to delete ${selectedRemote.size} item(s) from the remote server? This action cannot be undone.`,
            onConfirm: () => {
              handleRemoteDelete();
              setConfirmDialog(null);
            },
            type: 'danger',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localPath, remotePath, localFiles, remoteFiles, selectedLocal, selectedRemote, localFilter, remoteFilter, showHiddenFiles, onClose]);

  const loadLocalDirectory = async (path: string) => {
    try {
      setLoading(true);
      const result = await window.electron.fs.listDirectory(path);
      if (result.success) {
        setLocalFiles(result.data.entries);
        setLocalPath(path);
      } else {
        setError(result.error || 'Failed to load local directory');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRemoteDirectory = async (path: string) => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const result = await window.electron.sftp.listDirectory(sessionId, path);
      if (result.success) {
        setRemoteFiles(result.data.entries);
        setRemotePath(path);
      } else {
        setError(result.error || 'Failed to load remote directory');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedFiles = (
    files: FileEntry[],
    filter: string,
    sortColumn: SortColumn,
    sortDirection: SortDirection,
    showHidden: boolean
  ): FileEntry[] => {
    // Filter
    let filtered = files.filter(file => {
      if (!showHidden && file.name.startsWith('.')) return false;
      if (filter && !file.name.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      // Directories first always
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      let comparison = 0;
      if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === 'size') {
        comparison = (a.size || 0) - (b.size || 0);
      } else if (sortColumn === 'modified') {
        comparison = new Date(a.modifyTime).getTime() - new Date(b.modifyTime).getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getFileIcon = (file: FileEntry) => {
    if (file.type === 'directory') {
      return <Folder size={16} style={{ color: '#ffa500' }} />;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'java', 'cpp', 'c', 'h'].includes(ext || '')) {
      return <FileCode size={16} style={{ color: '#4fc3f7' }} />;
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext || '')) {
      return <FileImage size={16} style={{ color: '#66bb6a' }} />;
    }

    // Archives
    if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext || '')) {
      return <FileArchive size={16} style={{ color: '#ff9800' }} />;
    }

    // Data/Config
    if (['json', 'yaml', 'yml', 'xml', 'toml', 'ini', 'conf', 'config'].includes(ext || '')) {
      return <Database size={16} style={{ color: '#ab47bc' }} />;
    }

    // Text
    if (['txt', 'md', 'log', 'csv'].includes(ext || '')) {
      return <FileText size={16} style={{ color: '#78909c' }} />;
    }

    return <File size={16} style={{ color: '#999' }} />;
  };

  const handleUpload = async () => {
    if (!sessionId || selectedLocal.size === 0) return;

    const count = selectedLocal.size;
    let successCount = 0;

    for (const localFilePath of Array.from(selectedLocal)) {
      const file = localFiles.find((f) => f.path === localFilePath);
      if (!file) continue;

      const remoteFilePath = remotePath + '/' + file.name;
      try {
        if (file.type === 'directory') {
          const result = await window.electron.sftp.uploadDirectory(sessionId, file.path, remoteFilePath);
          if (result.success && result.data) {
            successCount++;
            result.data.forEach((transferId: string) => {
              setTransfers((prev) => [
                ...prev,
                {
                  id: transferId,
                  type: 'upload',
                  localPath: file.path,
                  remotePath: remoteFilePath,
                  filename: file.name,
                  size: 0,
                  transferred: 0,
                  status: 'transferring',
                  speed: 0,
                  startTime: new Date(),
                  priority: 0,
                  sessionId,
                },
              ]);
            });
          } else {
            setError(`Upload failed for ${file.name}: ${result.error || 'Unknown error'}`);
          }
        } else {
          const result = await window.electron.sftp.upload(sessionId, file.path, remoteFilePath);
          if (result.success) {
            successCount++;
            setTransfers((prev) => [
              ...prev,
              {
                id: result.data,
                type: 'upload',
                localPath: file.path,
                remotePath: remoteFilePath,
                filename: file.name,
                size: file.size,
                transferred: 0,
                status: 'transferring',
                speed: 0,
                startTime: new Date(),
                priority: 0,
                sessionId,
              },
            ]);
          } else {
            setError(`Upload failed for ${file.name}: ${result.error || 'Unknown error'}`);
          }
        }
      } catch (err: any) {
        setError(`Upload failed for ${file.name}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      console.log(`Started upload of ${successCount}/${count} file(s)`);
    }
    setSelectedLocal(new Set());
  };

  const handleDownload = async () => {
    if (!sessionId || selectedRemote.size === 0) return;

    for (const remoteFilePath of Array.from(selectedRemote)) {
      const file = remoteFiles.find((f) => f.path === remoteFilePath);
      if (!file) continue;

      const localFilePath = localPath + '/' + file.name;
      try {
        if (file.type === 'directory') {
          const result = await window.electron.sftp.downloadDirectory(sessionId, file.path, localFilePath);
          if (result.success && result.data) {
            result.data.forEach((transferId: string) => {
              setTransfers((prev) => [
                ...prev,
                {
                  id: transferId,
                  type: 'download',
                  localPath: localFilePath,
                  remotePath: file.path,
                  filename: file.name,
                  size: 0,
                  transferred: 0,
                  status: 'transferring',
                  speed: 0,
                  startTime: new Date(),
                  priority: 0,
                  sessionId,
                },
              ]);
            });
          }
        } else {
          const result = await window.electron.sftp.download(sessionId, file.path, localFilePath);
          if (result.success) {
            setTransfers((prev) => [
              ...prev,
              {
                id: result.data,
                type: 'download',
                localPath: localFilePath,
                remotePath: file.path,
                filename: file.name,
                size: file.size,
                transferred: 0,
                status: 'transferring',
                speed: 0,
                startTime: new Date(),
                priority: 0,
                sessionId,
              },
            ]);
          }
        }
      } catch (err: any) {
        setError(`Download failed: ${err.message}`);
      }
    }
    setSelectedRemote(new Set());
  };

  const handleRemoteDelete = async () => {
    if (!sessionId || selectedRemote.size === 0) return;

    for (const filePath of Array.from(selectedRemote)) {
      const file = remoteFiles.find((f) => f.path === filePath);
      if (!file) continue;

      try {
        const result =
          file.type === 'directory'
            ? await window.electron.sftp.rmdir(sessionId, file.path)
            : await window.electron.sftp.delete(sessionId, file.path);

        if (result.success) {
          await loadRemoteDirectory(remotePath);
        } else {
          setError(result.error || 'Delete failed');
        }
      } catch (err: any) {
        setError(`Delete failed: ${err.message}`);
      }
    }
    setSelectedRemote(new Set());
  };

  const navigateLocal = (file: FileEntry) => {
    if (file.type === 'directory') {
      loadLocalDirectory(file.path);
    }
  };

  const navigateRemote = (file: FileEntry) => {
    if (file.type === 'directory') {
      loadRemoteDirectory(file.path);
    }
  };

  const navigateLocalUp = () => {
    const parent = localPath.split('/').slice(0, -1).join('/') || '/';
    loadLocalDirectory(parent);
  };

  const navigateRemoteUp = () => {
    const parent = remotePath.split('/').slice(0, -1).join('/') || '/';
    loadRemoteDirectory(parent);
  };

  const toggleLocalSelection = (path: string, shiftKey: boolean, ctrlKey: boolean) => {
    setSelectedLocal((prev) => {
      const newSet = new Set(prev);
      const files = getFilteredAndSortedFiles(localFiles, localFilter, localSortColumn, localSortDirection, showHiddenFiles);

      if (shiftKey && lastSelectedLocal) {
        // Range selection
        const lastIndex = files.findIndex(f => f.path === lastSelectedLocal);
        const currentIndex = files.findIndex(f => f.path === path);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);

        for (let i = start; i <= end; i++) {
          newSet.add(files[i].path);
        }
      } else if (ctrlKey || !newSet.has(path)) {
        // Toggle or add
        if (newSet.has(path)) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }
      }

      setLastSelectedLocal(path);
      return newSet;
    });
  };

  const toggleRemoteSelection = (path: string, shiftKey: boolean, ctrlKey: boolean) => {
    setSelectedRemote((prev) => {
      const newSet = new Set(prev);
      const files = getFilteredAndSortedFiles(remoteFiles, remoteFilter, remoteSortColumn, remoteSortDirection, showHiddenFiles);

      if (shiftKey && lastSelectedRemote) {
        // Range selection
        const lastIndex = files.findIndex(f => f.path === lastSelectedRemote);
        const currentIndex = files.findIndex(f => f.path === path);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);

        for (let i = start; i <= end; i++) {
          newSet.add(files[i].path);
        }
      } else if (ctrlKey || !newSet.has(path)) {
        // Toggle or add
        if (newSet.has(path)) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }
      }

      setLastSelectedRemote(path);
      return newSet;
    });
  };

  const handleSortColumn = (pane: 'local' | 'remote', column: SortColumn) => {
    if (pane === 'local') {
      if (localSortColumn === column) {
        setLocalSortDirection(localSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setLocalSortColumn(column);
        setLocalSortDirection('asc');
      }
    } else {
      if (remoteSortColumn === column) {
        setRemoteSortDirection(remoteSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setRemoteSortColumn(column);
        setRemoteSortDirection('asc');
      }
    }
  };

  const getSortIcon = (pane: 'local' | 'remote', column: SortColumn) => {
    const isLocal = pane === 'local';
    const currentColumn = isLocal ? localSortColumn : remoteSortColumn;
    const currentDirection = isLocal ? localSortDirection : remoteSortDirection;

    if (currentColumn !== column) {
      return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    }

    return currentDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const renderBreadcrumb = (path: string, onNavigate: (path: string) => void) => {
    const parts = path.split('/').filter(Boolean);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        <button
          onClick={() => onNavigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '3px',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#333'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Home size={14} />
        </button>
        {parts.map((part, index) => {
          const fullPath = '/' + parts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={fullPath}>
              <ChevronRight size={14} style={{ color: '#666' }} />
              <button
                onClick={() => onNavigate(fullPath)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === parts.length - 1 ? '#ccc' : '#999',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: index === parts.length - 1 ? 600 : 400,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#333'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Drag-and-drop handlers
  const handleDragStart = (file: FileEntry, source: 'local' | 'remote', e: React.DragEvent) => {
    setDraggedFile({ file, source });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropOnLocal = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFile || !sessionId || draggedFile.source !== 'remote') return;

    const file = draggedFile.file;
    const localFilePath = localPath + '/' + file.name;

    // Confirm download
    setConfirmDialog({
      title: 'Download File',
      message: `Download "${file.name}" from remote server to local machine?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        await performDownload(file, localFilePath);
        setDraggedFile(null);
      },
      type: 'info',
    });
  };

  const performDownload = async (file: FileEntry, localFilePath: string) => {
    try {
      if (file.type === 'directory') {
        const result = await window.electron.sftp.downloadDirectory(sessionId, file.path, localFilePath);
        if (result.success && result.data) {
          result.data.forEach((transferId: string) => {
            setTransfers((prev) => [
              ...prev,
              {
                id: transferId,
                type: 'download',
                localPath: localFilePath,
                remotePath: file.path,
                filename: file.name,
                size: 0,
                transferred: 0,
                status: 'transferring',
                speed: 0,
                startTime: new Date(),
                priority: 0,
                sessionId,
              },
            ]);
          });
        }
      } else {
        const result = await window.electron.sftp.download(sessionId, file.path, localFilePath);
        if (result.success) {
          setTransfers((prev) => [
            ...prev,
            {
              id: result.data,
              type: 'download',
              localPath: localFilePath,
              remotePath: file.path,
              filename: file.name,
              size: file.size,
              transferred: 0,
              status: 'transferring',
              speed: 0,
              startTime: new Date(),
              priority: 0,
              sessionId,
            },
          ]);
        }
      }
    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
    }
    setDraggedFile(null);
  };

  const handleDropOnRemote = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFile || !sessionId || draggedFile.source !== 'local') return;

    const file = draggedFile.file;
    const remoteFilePath = remotePath + '/' + file.name;

    // Confirm upload
    setConfirmDialog({
      title: 'Upload File',
      message: `Upload "${file.name}" from local machine to remote server?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        await performUpload(file, remoteFilePath);
        setDraggedFile(null);
      },
      type: 'info',
    });
  };

  const performUpload = async (file: FileEntry, remoteFilePath: string) => {
    try {
      if (file.type === 'directory') {
        const result = await window.electron.sftp.uploadDirectory(sessionId, file.path, remoteFilePath);
        if (result.success && result.data) {
          result.data.forEach((transferId: string) => {
            setTransfers((prev) => [
              ...prev,
              {
                id: transferId,
                type: 'upload',
                localPath: file.path,
                remotePath: remoteFilePath,
                filename: file.name,
                size: 0,
                transferred: 0,
                status: 'transferring',
                speed: 0,
                startTime: new Date(),
                priority: 0,
                sessionId,
              },
            ]);
          });
        }
      } else {
        const result = await window.electron.sftp.upload(sessionId, file.path, remoteFilePath);
        if (result.success) {
          setTransfers((prev) => [
            ...prev,
            {
              id: result.data,
              type: 'upload',
              localPath: file.path,
              remotePath: remoteFilePath,
              filename: file.name,
              size: file.size,
              transferred: 0,
              status: 'transferring',
              speed: 0,
              startTime: new Date(),
              priority: 0,
              sessionId,
            },
          ]);
        }
      }
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    }
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
  };

  const filteredLocalFiles = getFilteredAndSortedFiles(localFiles, localFilter, localSortColumn, localSortDirection, showHiddenFiles);
  const filteredRemoteFiles = getFilteredAndSortedFiles(remoteFiles, remoteFilter, remoteSortColumn, remoteSortDirection, showHiddenFiles);

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 900,
        borderTop: '1px solid #333',
      }}
    >
      {/* Compact Toolbar */}
      <div
        style={{
          padding: '8px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleUpload}
            disabled={selectedLocal.size === 0}
            style={{
              padding: '6px 12px',
              backgroundColor: selectedLocal.size > 0 ? '#0e639c' : '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              color: selectedLocal.size > 0 ? 'white' : '#666',
              cursor: selectedLocal.size > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Upload size={14} />
            Upload {selectedLocal.size > 0 && `(${selectedLocal.size})`}
          </button>
          <button
            onClick={handleDownload}
            disabled={selectedRemote.size === 0}
            style={{
              padding: '6px 12px',
              backgroundColor: selectedRemote.size > 0 ? '#0e639c' : '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              color: selectedRemote.size > 0 ? 'white' : '#666',
              cursor: selectedRemote.size > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Download size={14} />
            Download {selectedRemote.size > 0 && `(${selectedRemote.size})`}
          </button>
          <button
            onClick={() => {
              if (selectedRemote.size > 0) {
                setConfirmDialog({
                  title: 'Delete Files',
                  message: `Are you sure you want to delete ${selectedRemote.size} item(s) from the remote server? This action cannot be undone.`,
                  onConfirm: () => {
                    handleRemoteDelete();
                    setConfirmDialog(null);
                  },
                  type: 'danger',
                });
              }
            }}
            disabled={selectedRemote.size === 0}
            style={{
              padding: '6px 12px',
              backgroundColor: selectedRemote.size > 0 ? '#dc3545' : '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              color: selectedRemote.size > 0 ? 'white' : '#666',
              cursor: selectedRemote.size > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => {
              loadLocalDirectory(localPath);
              loadRemoteDirectory(remotePath);
            }}
            style={{
              padding: '6px 10px',
              background: '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              color: '#ccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Refresh (Ctrl+R)"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowHiddenFiles(!showHiddenFiles)}
            style={{
              padding: '6px 10px',
              background: showHiddenFiles ? '#0e639c' : '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              color: showHiddenFiles ? 'white' : '#ccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
            title="Toggle hidden files (Ctrl+H)"
          >
            {showHiddenFiles ? <Eye size={14} /> : <EyeOff size={14} />}
            Hidden
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 10px',
              background: '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              color: '#ccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Close File Manager (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '8px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Dual Pane */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Local Files */}
        <div
          data-pane="local"
          tabIndex={0}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', outline: 'none' }}
          onDragOver={handleDragOver}
          onDrop={handleDropOnLocal}
        >
          {/* Breadcrumb + Search */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #333',
              backgroundColor: '#252525',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                <Monitor size={16} style={{ color: '#66bb6a' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#66bb6a' }}>LOCAL</span>
              </div>
              <button
                onClick={navigateLocalUp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Navigate up (Backspace)"
              >
                <ArrowLeft size={16} />
              </button>
              {renderBreadcrumb(localPath, loadLocalDirectory)}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                placeholder="Filter files..."
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 28px',
                  background: '#1e1e1e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#ccc',
                  fontSize: '12px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0e639c'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#444'}
              />
            </div>
          </div>

          {/* Table Header */}
          <div style={{ borderBottom: '1px solid #333', backgroundColor: '#252525' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 80px 100px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#999' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedLocal.size > 0 && selectedLocal.size === filteredLocalFiles.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLocal(new Set(filteredLocalFiles.map(f => f.path)));
                    } else {
                      setSelectedLocal(new Set());
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div
                onClick={() => handleSortColumn('local', 'name')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
              >
                Name {getSortIcon('local', 'name')}
              </div>
              <div
                onClick={() => handleSortColumn('local', 'size')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
              >
                Size {getSortIcon('local', 'size')}
              </div>
              <div
                onClick={() => handleSortColumn('local', 'modified')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
              >
                Modified {getSortIcon('local', 'modified')}
              </div>
            </div>
          </div>

          {/* File List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filteredLocalFiles.map((file) => (
              <div
                key={file.path}
                draggable={true}
                onDragStart={(e) => handleDragStart(file, 'local', e)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  if (file.type === 'directory') {
                    navigateLocal(file);
                  } else {
                    toggleLocalSelection(file.path, e.shiftKey, e.ctrlKey || e.metaKey);
                  }
                }}
                onMouseEnter={() => setHoveredLocalRow(file.path)}
                onMouseLeave={() => setHoveredLocalRow(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr 80px 100px',
                  padding: '4px 12px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: file.type === 'directory' ? 'pointer' : 'default',
                  backgroundColor: selectedLocal.has(file.path) ? '#0e639c33' : hoveredLocalRow === file.path ? '#2a2a2a' : 'transparent',
                  alignItems: 'center',
                  fontSize: '13px',
                  opacity: draggedFile?.file.path === file.path && draggedFile?.source === 'local' ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedLocal.has(file.path)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleLocalSelection(file.path, e.shiftKey, e.ctrlKey || e.metaKey);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {getFileIcon(file)}
                  <span style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                </div>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  {file.type !== 'directory' ? formatSize(file.size) : '-'}
                </div>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  {formatDate(file.modifyTime)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remote Files */}
        <div
          data-pane="remote"
          tabIndex={0}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', outline: 'none' }}
          onDragOver={handleDragOver}
          onDrop={handleDropOnRemote}
        >
          {/* Breadcrumb + Search */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #333',
              backgroundColor: '#252525',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                <Server size={16} style={{ color: '#4fc3f7' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#4fc3f7' }}>REMOTE</span>
              </div>
              <button
                onClick={navigateRemoteUp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Navigate up (Backspace)"
              >
                <ArrowLeft size={16} />
              </button>
              {renderBreadcrumb(remotePath, loadRemoteDirectory)}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                placeholder="Filter files..."
                value={remoteFilter}
                onChange={(e) => setRemoteFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 28px',
                  background: '#1e1e1e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#ccc',
                  fontSize: '12px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0e639c'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#444'}
              />
            </div>
          </div>

          {/* Table Header */}
          <div style={{ borderBottom: '1px solid #333', backgroundColor: '#252525' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 80px 100px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#999' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedRemote.size > 0 && selectedRemote.size === filteredRemoteFiles.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRemote(new Set(filteredRemoteFiles.map(f => f.path)));
                    } else {
                      setSelectedRemote(new Set());
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div
                onClick={() => handleSortColumn('remote', 'name')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
              >
                Name {getSortIcon('remote', 'name')}
              </div>
              <div
                onClick={() => handleSortColumn('remote', 'size')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
              >
                Size {getSortIcon('remote', 'size')}
              </div>
              <div
                onClick={() => handleSortColumn('remote', 'modified')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
              >
                Modified {getSortIcon('remote', 'modified')}
              </div>
            </div>
          </div>

          {/* File List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filteredRemoteFiles.map((file) => (
              <div
                key={file.path}
                draggable={true}
                onDragStart={(e) => handleDragStart(file, 'remote', e)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  if (file.type === 'directory') {
                    navigateRemote(file);
                  } else {
                    toggleRemoteSelection(file.path, e.shiftKey, e.ctrlKey || e.metaKey);
                  }
                }}
                onMouseEnter={() => setHoveredRemoteRow(file.path)}
                onMouseLeave={() => setHoveredRemoteRow(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr 80px 100px',
                  padding: '4px 12px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: file.type === 'directory' ? 'pointer' : 'default',
                  backgroundColor: selectedRemote.has(file.path) ? '#0e639c33' : hoveredRemoteRow === file.path ? '#2a2a2a' : 'transparent',
                  alignItems: 'center',
                  fontSize: '13px',
                  opacity: draggedFile?.file.path === file.path && draggedFile?.source === 'remote' ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedRemote.has(file.path)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleRemoteSelection(file.path, e.shiftKey, e.ctrlKey || e.metaKey);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {getFileIcon(file)}
                  <span style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                </div>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  {file.type !== 'directory' ? formatSize(file.size) : '-'}
                </div>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  {formatDate(file.modifyTime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Queue */}
      {transfers.length > 0 && <TransferQueue transfers={transfers} />}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          type={confirmDialog.type}
        />
      )}
    </div>
  );
};
