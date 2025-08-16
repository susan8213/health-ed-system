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
        throw new Error('Failed to fetch weekly records');
      }

      const data = await response.json();
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        <div className="loading">Loading weekly records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
        <a href="/" className="search-button">Back to Patient Search</a>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="records-container">
        <div className="records-header">
          <h1>This Week's Medical Records</h1>
          <p className="week-range">
            {weekRange.start} - {weekRange.end}
          </p>
          <div className="header-actions">
            <a href="/" className="back-button">
              Back to Patient Search
            </a>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="no-results">
            No medical records found for this week.
          </div>
        ) : (
          <div className="records-list">
            <div className="records-count">
              Found {records.length} record{records.length !== 1 ? 's' : ''} this week
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
                      <strong>Symptoms:</strong>
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
                      <strong>TCM Syndromes:</strong>
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
                      <strong>Clinical Notes:</strong>
                      <p className="notes-text">{record.notes}</p>
                    </div>
                  )}
                </div>

                <div className="record-actions">
                  <a 
                    href={`/edit/${record.patientId}`}
                    className="edit-button-small"
                  >
                    Edit Record
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