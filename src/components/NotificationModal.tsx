'use client';

import { useState } from 'react';
import { Patient } from '@/types/user';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatients: Patient[];
  onSend: (podcastUrl: string) => void;
  sending: boolean;
}

export default function NotificationModal({
  isOpen,
  onClose,
  selectedPatients,
  onSend,
  sending
}: NotificationModalProps) {
  const [podcastUrl, setPodcastUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSend(podcastUrl);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>發送衛教影音通知</h2>
          <button className="modal-close" onClick={onClose}>
            X
          </button>
        </div>
        
        <div className="modal-body">
          <div className="selected-patients">
            <h3>將推播給以下患者 ({selectedPatients.length} 位)：</h3>
            <div className="patient-list">
              {selectedPatients.map(user => (
                <div key={user._id} className="selected-patient">
                  <span className="patient-name">{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="podcastUrl">影音網址：</label>
            <input
              id="podcastUrl"
              type="url"
              value={podcastUrl}
              onChange={(e) => setPodcastUrl(e.target.value)}
              placeholder="https://example.com/podcast-episode"
              className="form-input"
              disabled={sending}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={sending}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="send-button"
            disabled={sending || !podcastUrl.trim()}
          >
            {sending ? '發送中...' : `發送給 ${selectedPatients.length} 位患者`}
          </button>
        </div>
      </div>
    </div>
  );
}