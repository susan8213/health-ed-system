'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
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

      const data = await api.get(`/api/users?${params.toString()}`);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤');
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
      alert('請輸入播客網址');
      return;
    }

    if (selectedPatients.size === 0) {
      alert('請至少選擇一位患者');
      return;
    }

    setSending(true);
    try {
      const selectedUsers = users.filter(user => selectedPatients.has(user._id!));
      const lineIds = selectedUsers.map(user => user.lineId).filter(Boolean);

      const result = await api.post('/api/notifications/send', {
        lineIds,
        podcastUrl: podcastUrl.trim(),
        patients: selectedUsers.map(user => ({ name: user.name, lineId: user.lineId }))
      });
      alert(`通知已成功發送給 ${result.sentCount} 位患者！`);
      setShowModal(false);
      setPodcastUrl('');
      setLinkPreview(null);
      setSelectedPatients(new Set());
    } catch (err) {
      alert('發送通知失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setSending(false);
    }
  };

  const seedDatabase = async () => {
    setLoading(true);
    try {
      await api.post('/api/users/seed');
      // Refresh the patient list after seeding
      await handleSearch({});
      alert('資料庫初始化成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '資料庫初始化失敗');
    } finally {
      setLoading(false);
    }
  };

  const selectedUsersWithLine = useMemo(() => users.filter(user => 
    selectedPatients.has(user._id!) && user.lineId
  ), [users, selectedPatients]);

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
      const preview = await api.post('/api/link-preview', { url });
      setLinkPreview(preview);
    } catch (error) {
      console.error('擷取連結預覽失敗:', error);
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
          錯誤：{error}
        </div>
      )}

      <div className="results-container">
        <div className="results-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>
              {loading ? '搜尋中...' : `找到 ${users.length} 位患者`}
            </h2>
            <div className="header-buttons">
              {selectedPatients.size > 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="notification-button"
                  disabled={loading}
                >
                  發送播客 ({selectedPatients.size} 已選擇)
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
                建立測試資料
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading">
            搜尋患者中...
          </div>
        )}

        {!loading && hasSearched && users.length === 0 && (
          <div className="no-results">
            沒有找到患者。請嘗試不同的搜尋詞彙或建立測試資料。
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
                全選有 LINE ID 的患者 ({users.filter(u => u.lineId).length} 位可用)
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
                <h2>發送播客通知</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  X
                </button>
              </div>
              
              <div className="modal-body">
                <div className="selected-patients">
                  <h3>已選擇患者 ({selectedUsersWithLine.length})：</h3>
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
                  <label htmlFor="podcastUrl">播客網址：</label>
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
                      <div className="preview-loading">載入預覽中...</div>
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
                  取消
                </button>
                <button
                  onClick={handleSendNotifications}
                  className="send-button"
                  disabled={sending || !podcastUrl.trim()}
                >
                  {sending ? '發送中...' : `發送給 ${selectedUsersWithLine.length} 位患者`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}