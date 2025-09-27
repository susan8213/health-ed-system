'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Patient, TCMHistoryRecord } from '@/types/user';

export default function PatientRecords() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${patientId}`);
      
      if (!response.ok) {
        throw new Error('獲取患者資料失敗');
      }

      const data = await response.json();
      setPatient(data.patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">載入患者記錄中...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container">
        <div className="error">錯誤：{error || '找不到患者'}</div>
        <button onClick={handleBack} className="search-button">
          返回患者搜尋
        </button>
      </div>
    );
  }

  const sortedRecords = patient.historyRecords
    ? [...patient.historyRecords].sort((a, b) => 
        new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
      )
    : [];

  return (
    <div className="container">
      <div className="records-container">
        <div className="records-header">
          <h1>{patient.name} - 病歷記錄</h1>
          {patient.lineId && (
            <p className="patient-line-id">LINE ID: {patient.lineId}</p>
          )}
          <div className="header-actions">
            <button onClick={handleBack} className="back-button">
              返回患者搜尋
            </button>
          </div>
        </div>

        {sortedRecords.length === 0 ? (
          <div className="no-results">
            找不到此患者的病歷記錄。
          </div>
        ) : (
          <div className="records-list">
            <div className="records-count">
              找到 {sortedRecords.length} 筆記錄
            </div>
            
            {sortedRecords.map((record, index) => (
              <div key={`${record.visitDate}-${index}`} className="record-card">
                <div className="record-header">
                  <div className="visit-info">
                    <span className="visit-date">
                      {new Date(record.visitDate).toLocaleDateString()}
                    </span>
                    <span className="visit-time">
                      {new Date(record.visitDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="record-status">
                    {index === 0 && <span className="latest-badge">最新</span>}
                  </div>
                </div>

                <div className="record-content">
                  {record.symptoms.length > 0 && (
                    <div className="record-section">
                      <strong>症狀：</strong>
                      <div className="symptoms-list">
                        {record.symptoms.map((symptom, idx) => (
                          <span key={idx} className="symptom-tag">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.syndromes.length > 0 && (
                    <div className="record-section">
                      <strong>中醫證候：</strong>
                      <div className="syndromes-list">
                        {record.syndromes.map((syndrome, idx) => (
                          <span key={idx} className="syndrome-tag">
                            {syndrome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="record-section">
                      <strong>診療備註：</strong>
                      <p className="notes-text">{record.notes}</p>
                    </div>
                  )}

                  <div className="record-meta">
                    <small className="created-date">
                      建立時間：{new Date(record.createdAt).toLocaleString()}
                    </small>
                    {record.updatedAt && new Date(record.updatedAt).getTime() !== new Date(record.createdAt).getTime() && (
                      <small className="updated-date">
                        更新時間：{new Date(record.updatedAt).toLocaleString()}
                      </small>
                    )}
                  </div>
                </div>

                {index === 0 && (
                  <div className="record-actions">
                    <a 
                      href={`/edit/${patient._id}`}
                      className="edit-button-small"
                    >
                      編輯最新記錄
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}