'use client';

import { useState, useEffect } from 'react';
import { Patient, TCMHistoryRecord } from '@/types/user';

interface RecordWithPatient extends TCMHistoryRecord {
  patientName: string;
  patientLineId?: string;
  patientId: string;
}

export default function WeeklyRecords() {
  const [records, setRecords] = useState<RecordWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyRecords();
  }, []);

  const fetchWeeklyRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/records/weekly');
      
      if (!response.ok) {
        throw new Error('獲取週記錄失敗');
      }

      const data = await response.json();
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const getWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start of week
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      start: startOfWeek.toLocaleDateString(),
      end: endOfWeek.toLocaleDateString()
    };
  };

  const weekRange = getWeekRange();

  if (loading) {
    return (
      <div className="container">
        <div className="loading">載入本週記錄中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">錯誤: {error}</div>
        <a href="/" className="search-button">返回患者搜尋</a>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="records-container">
        <div className="records-header">
          <h1>本週問診記錄</h1>
          <p className="week-range">
            {weekRange.start} - {weekRange.end}
          </p>
          <div className="header-actions">
            <a href="/" className="back-button">
              返回患者搜尋
            </a>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="no-results">
            本週沒有找到問診記錄。
          </div>
        ) : (
          <div className="records-list">
            <div className="records-count">
              本週找到 {records.length} 筆記錄
            </div>
            
            {records.map((record, index) => (
              <div key={`${record.patientId}-${record.visitDate}-${index}`} className="record-card">
                <div className="record-header">
                  <div className="patient-info">
                    <h3>{record.patientName}</h3>
                    {record.patientLineId && (
                      <span className="line-id">LINE: {record.patientLineId}</span>
                    )}
                  </div>
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
                </div>

                <div className="record-actions">
                  <a 
                    href={`/edit/${record.patientId}`}
                    className="edit-button-small"
                  >
                    編輯記錄
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}