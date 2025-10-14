import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  Upload,
  Download,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Home,
  ArrowLeft,
  HardDrive,
} from 'lucide-react';
import { FileEntry, Transfer } from '../../../shared/types/sftp';
import { TransferQueue } from './TransferQueue';

interface FileManagerProps {
  sessionId: string | null;
  onClose: () => void;
}

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

  const loadLocalDirectory = async (path: string) => {
    try {
      setLoading(true);
      const result = await window.electron.fs.listDirectory(path);
      if (result.success) {
        setLocalFiles(result.data.entries.sort(sortFiles));
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
        setRemoteFiles(result.data.entries.sort(sortFiles));
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

  const sortFiles = (a: FileEntry, b: FileEntry) => {
    // Directories first
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    // Then alphabetically
    return a.name.localeCompare(b.name);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  const handleUpload = async () => {
    if (!sessionId || selectedLocal.size === 0) return;

    for (const localFilePath of Array.from(selectedLocal)) {
      const file = localFiles.find((f) => f.path === localFilePath);
      if (!file) continue;

      const remoteFilePath = remotePath + '/' + file.name;
      try {
        if (file.type === 'directory') {
          // Upload directory
          const result = await window.electron.sftp.uploadDirectory(sessionId, file.path, remoteFilePath);
          if (result.success && result.data) {
            // Add all file transfers to the queue
            result.data.forEach((transferId: string) => {
              setTransfers((prev) => [
                ...prev,
                {
                  id: transferId,
                  type: 'upload',
                  localPath: file.path,
                  remotePath: remoteFilePath,
                  filename: file.name,
                  size: 0, // Size will be updated by progress events
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
          // Upload single file
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
          // Download directory
          const result = await window.electron.sftp.downloadDirectory(sessionId, file.path, localFilePath);
          if (result.success && result.data) {
            // Add all file transfers to the queue
            result.data.forEach((transferId: string) => {
              setTransfers((prev) => [
                ...prev,
                {
                  id: transferId,
                  type: 'download',
                  localPath: localFilePath,
                  remotePath: file.path,
                  filename: file.name,
                  size: 0, // Size will be updated by progress events
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
          // Download single file
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

  const handleLocalDelete = async () => {
    // Note: Local file deletion would require additional IPC handlers
    setError('Local file deletion not yet implemented');
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

  const toggleLocalSelection = (path: string) => {
    setSelectedLocal((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const toggleRemoteSelection = (path: string) => {
    setSelectedRemote((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Drag-and-drop handlers
  const handleDragStart = (file: FileEntry, source: 'local' | 'remote', e: React.DragEvent) => {
    // Allow dragging both files and directories
    setDraggedFile({ file, source });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropOnLocal = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFile || !sessionId) return;

    // Only allow drops from remote to local (download)
    if (draggedFile.source === 'remote') {
      const file = draggedFile.file;
      const localFilePath = localPath + '/' + file.name;

      try {
        if (file.type === 'directory') {
          // Download directory
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
          // Download single file
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
    setDraggedFile(null);
  };

  const handleDropOnRemote = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFile || !sessionId) return;

    // Only allow drops from local to remote (upload)
    if (draggedFile.source === 'local') {
      const file = draggedFile.file;
      const remoteFilePath = remotePath + '/' + file.name;

      try {
        if (file.type === 'directory') {
          // Upload directory
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
          // Upload single file
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
    }
    setDraggedFile(null);
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '15px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          <HardDrive size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          File Manager
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0 10px',
          }}
        >
          ×
        </button>
      </div>

      {/* Toolbar */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={handleUpload}
          disabled={selectedLocal.size === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedLocal.size > 0 ? '#0e639c' : '#333',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: selectedLocal.size > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Upload size={16} />
          Upload
        </button>
        <button
          onClick={handleDownload}
          disabled={selectedRemote.size === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedRemote.size > 0 ? '#0e639c' : '#333',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: selectedRemote.size > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Download size={16} />
          Download
        </button>
        <button
          onClick={handleRemoteDelete}
          disabled={selectedRemote.size === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedRemote.size > 0 ? '#dc3545' : '#333',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: selectedRemote.size > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
              fontSize: '18px',
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
          style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}
          onDragOver={handleDragOver}
          onDrop={handleDropOnLocal}
        >
          <div
            style={{
              padding: '10px 20px',
              borderBottom: '1px solid #333',
              backgroundColor: '#252525',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              onClick={navigateLocalUp}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Navigate up"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={async () => {
                const homeResult = await window.electron.fs.getHome();
                if (homeResult.success) {
                  loadLocalDirectory(homeResult.data);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Go to home directory"
            >
              <Home size={16} />
            </button>
            <span style={{ fontSize: '14px', color: '#ccc' }}>{localPath}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {localFiles.map((file) => (
              <div
                key={file.path}
                draggable={true}
                onDragStart={(e) => handleDragStart(file, 'local', e)}
                onDragEnd={handleDragEnd}
                onClick={() => navigateLocal(file)}
                onDoubleClick={() => toggleLocalSelection(file.path)}
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: 'grab',
                  backgroundColor: selectedLocal.has(file.path) ? '#0e639c33' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: draggedFile?.file.path === file.path && draggedFile?.source === 'local' ? 0.5 : 1,
                }}
              >
                {file.type === 'directory' ? <Folder size={18} color="#ffa500" /> : <File size={18} color="#999" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ccc' }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {file.type !== 'directory' && formatSize(file.size)} · {formatDate(file.modifyTime)}
                  </div>
                </div>
                {file.type === 'directory' && <ChevronRight size={16} color="#666" />}
              </div>
            ))}
          </div>
        </div>

        {/* Remote Files */}
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          onDragOver={handleDragOver}
          onDrop={handleDropOnRemote}
        >
          <div
            style={{
              padding: '10px 20px',
              borderBottom: '1px solid #333',
              backgroundColor: '#252525',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              onClick={navigateRemoteUp}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Navigate up"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => loadRemoteDirectory('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Go to root directory"
            >
              <Home size={16} />
            </button>
            <HardDrive size={16} style={{ color: '#999' }} />
            <span style={{ fontSize: '14px', color: '#ccc' }}>{remotePath}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {remoteFiles.map((file) => (
              <div
                key={file.path}
                draggable={true}
                onDragStart={(e) => handleDragStart(file, 'remote', e)}
                onDragEnd={handleDragEnd}
                onClick={() => navigateRemote(file)}
                onDoubleClick={() => toggleRemoteSelection(file.path)}
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: 'grab',
                  backgroundColor: selectedRemote.has(file.path) ? '#0e639c33' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: draggedFile?.file.path === file.path && draggedFile?.source === 'remote' ? 0.5 : 1,
                }}
              >
                {file.type === 'directory' ? <Folder size={18} color="#ffa500" /> : <File size={18} color="#999" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#ccc' }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {file.type !== 'directory' && formatSize(file.size)} · {formatDate(file.modifyTime)}
                  </div>
                </div>
                {file.type === 'directory' && <ChevronRight size={16} color="#666" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Queue */}
      {transfers.length > 0 && <TransferQueue transfers={transfers} />}
    </div>
  );
};
