'use client';

import { useState, useEffect } from 'react';
import SearchForm from '@/components/SearchForm';
import UserCard from '@/components/UserCard';
import { Patient } from '@/types/user';

export default function Home() {
  const [users, setUsers] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [podcastUrl, setPodcastUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load all patients on initial page load
  useEffect(() => {
    handleSearch({});
  }, []);

  const handleSearch = async (filters: {
    keyword?: string;
    symptoms?: string;
    conditions?: string;
  }) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.keyword) {
        params.append('keyword', filters.keyword);
      }
      if (filters.symptoms) {
        params.append('symptoms', filters.symptoms);
      }
      if (filters.conditions) {
        params.append('conditions', filters.conditions);
      }

      const response = await fetch(`/api/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to search patients');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    const newSelected = new Set(selectedPatients);
    if (checked) {
      newSelected.add(patientId);
    } else {
      newSelected.delete(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = users.filter(user => user.lineId).map(user => user._id!);
      setSelectedPatients(new Set(allIds));
    } else {
      setSelectedPatients(new Set());
    }
  };

  const handleSendNotifications = async () => {
    if (!podcastUrl.trim()) {
      alert('Please enter a podcast URL');
      return;
    }

    if (selectedPatients.size === 0) {
      alert('Please select at least one patient');
      return;
    }

    setSending(true);
    try {
      const selectedUsers = users.filter(user => selectedPatients.has(user._id!));
      const lineIds = selectedUsers.map(user => user.lineId).filter(Boolean);

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineIds,
          podcastUrl: podcastUrl.trim(),
          patients: selectedUsers.map(user => ({ name: user.name, lineId: user.lineId }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notifications');
      }

      const result = await response.json();
      alert(`Notifications sent successfully to ${result.sentCount} patients!`);
      setShowModal(false);
      setPodcastUrl('');
      setLinkPreview(null);
      setSelectedPatients(new Set());
    } catch (err) {
      alert('Failed to send notifications: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const seedDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/seed', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to seed database');
      }

      // Refresh the patient list after seeding
      await handleSearch({});
      alert('Database seeded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  const selectedUsersWithLine = users.filter(user => 
    selectedPatients.has(user._id!) && user.lineId
  );

  const fetchLinkPreview = async (url: string) => {
    if (!url.trim()) {
      setLinkPreview(null);
      return;
    }

    try {
      new URL(url); // Validate URL format
    } catch {
      setLinkPreview(null);
      return;
    }

    setLoadingPreview(true);
    try {
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const preview = await response.json();
        setLinkPreview(preview);
      } else {
        setLinkPreview(null);
      }
    } catch (error) {
      console.error('Error fetching link preview:', error);
      setLinkPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setPodcastUrl(url);
    
    // Clear existing preview when URL changes
    setLinkPreview(null);
    
    // Debounce the preview fetch
    setTimeout(() => {
      fetchLinkPreview(url);
    }, 500);
  };

  return (
    <div className="container">
      <SearchForm onSearch={handleSearch} loading={loading} />

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <div className="results-container">
        <div className="results-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>
              {loading ? 'Searching...' : `Found ${users.length} patient${users.length !== 1 ? 's' : ''}`}
            </h2>
            <div className="header-buttons">
              {selectedPatients.size > 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="notification-button"
                  disabled={loading}
                >
                  Send Podcast ({selectedPatients.size} selected)
                </button>
              )}
              <button
                onClick={seedDatabase}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Seed Sample Data
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading">
            Searching patients...
          </div>
        )}

        {!loading && hasSearched && users.length === 0 && (
          <div className="no-results">
            No patients found. Try a different search term or seed the database with sample data.
          </div>
        )}

        {!loading && users.length > 0 && (
          <div>
            <div className="selection-controls">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedPatients.size === users.filter(u => u.lineId).length && users.filter(u => u.lineId).length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                Select All Patients with LINE ID ({users.filter(u => u.lineId).length} available)
              </label>
            </div>
            {users.map((user) => (
              <UserCard 
                key={user._id} 
                user={user} 
                isSelected={selectedPatients.has(user._id!)}
                onSelect={handleSelectPatient}
              />
            ))}
          </div>
        )}

        {/* Notification Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Send Podcast Notification</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  X
                </button>
              </div>
              
              <div className="modal-body">
                <div className="selected-patients">
                  <h3>Selected Patients ({selectedUsersWithLine.length}):</h3>
                  <div className="patient-list">
                    {selectedUsersWithLine.map(user => (
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
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/podcast-episode"
                    className="form-input"
                    disabled={sending}
                  />
                  
                  {loadingPreview && (
                    <div className="link-preview loading">
                      <div className="preview-loading">Loading preview...</div>
                    </div>
                  )}

                  {linkPreview && !loadingPreview && (
                    <div className="link-preview">
                      <div className="preview-content">
                        {linkPreview.image && (
                          <div className="preview-image">
                            <img 
                              src={linkPreview.image} 
                              alt={linkPreview.title}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="preview-text">
                          <div className="preview-title">{linkPreview.title}</div>
                          {linkPreview.description && (
                            <div className="preview-description">{linkPreview.description}</div>
                          )}
                          <div className="preview-domain">{linkPreview.domain}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowModal(false)}
                  className="cancel-button"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotifications}
                  className="send-button"
                  disabled={sending || !podcastUrl.trim()}
                >
                  {sending ? 'Sending...' : `Send to ${selectedUsersWithLine.length} patients`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}