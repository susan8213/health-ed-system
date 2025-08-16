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
          <h2>Send Podcast Notification</h2>
          <button className="modal-close" onClick={onClose}>
            X
          </button>
        </div>
        
        <div className="modal-body">
          <div className="selected-patients">
            <h3>Selected Patients ({selectedPatients.length}):</h3>
            <div className="patient-list">
              {selectedPatients.map(user => (
                <div key={user._id} className="selected-patient">
                  <span className="patient-name">{user.name}</span>
                  <span className="patient-line">LINE: {user.lineId}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="podcastUrl">Podcast URL:</label>
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
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="send-button"
            disabled={sending || !podcastUrl.trim()}
          >
            {sending ? 'Sending...' : `Send to ${selectedPatients.length} patients`}
          </button>
        </div>
      </div>
    </div>
  );
}