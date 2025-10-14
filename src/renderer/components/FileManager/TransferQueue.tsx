import React from 'react';
import { Upload, Download, X, Pause, Play } from 'lucide-react';
import { Transfer } from '../../../shared/types/sftp';

interface TransferQueueProps {
  transfers: Transfer[];
}

export const TransferQueue: React.FC<TransferQueueProps> = ({ transfers }) => {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatSize(bytesPerSecond) + '/s';
  };

  const calculateProgress = (transfer: Transfer): number => {
    return Math.round((transfer.transferred / transfer.size) * 100);
  };

  const calculateETA = (transfer: Transfer): string => {
    if (transfer.speed === 0) return 'Calculating...';
    const remaining = transfer.size - transfer.transferred;
    const secondsRemaining = remaining / transfer.speed;

    if (secondsRemaining < 60) {
      return `${Math.round(secondsRemaining)}s`;
    } else if (secondsRemaining < 3600) {
      return `${Math.round(secondsRemaining / 60)}m`;
    } else {
      return `${Math.round(secondsRemaining / 3600)}h`;
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid #333',
        backgroundColor: '#252525',
        maxHeight: '200px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #333',
          fontSize: '14px',
          fontWeight: 600,
          color: '#ccc',
        }}
      >
        Transfers ({transfers.length})
      </div>
      {transfers.map((transfer) => {
        const progress = calculateProgress(transfer);
        return (
          <div
            key={transfer.id}
            style={{
              padding: '10px 20px',
              borderBottom: '1px solid #2a2a2a',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}
            >
              {transfer.type === 'upload' ? (
                <Upload size={16} color="#0e639c" />
              ) : (
                <Download size={16} color="#28a745" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: '#ccc' }}>{transfer.filename}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatSize(transfer.transferred)} / {formatSize(transfer.size)} · {formatSpeed(transfer.speed)} ·
                  ETA: {calculateETA(transfer)}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>{progress}%</div>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#333',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: transfer.type === 'upload' ? '#0e639c' : '#28a745',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
