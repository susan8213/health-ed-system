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
        throw new Error('Failed to fetch patient');
      }

      const data = await response.json();
      setPatient(data.patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        <div className="loading">Loading patient records...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container">
        <div className="error">Error: {error || 'Patient not found'}</div>
        <button onClick={handleBack} className="search-button">
          Back to Patient Search
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
          <h1>{patient.name} - Medical Records</h1>
          {patient.lineId && (
            <p className="patient-line-id">LINE ID: {patient.lineId}</p>
          )}
          <div className="header-actions">
            <button onClick={handleBack} className="back-button">
              Back to Patient Search
            </button>
          </div>
        </div>

        {sortedRecords.length === 0 ? (
          <div className="no-results">
            No medical records found for this patient.
          </div>
        ) : (
          <div className="records-list">
            <div className="records-count">
              {sortedRecords.length} record{sortedRecords.length !== 1 ? 's' : ''} found
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
                    {index === 0 && <span className="latest-badge">Latest</span>}
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

                  <div className="record-meta">
                    <small className="created-date">
                      Created: {new Date(record.createdAt).toLocaleString()}
                    </small>
                    {record.updatedAt && new Date(record.updatedAt).getTime() !== new Date(record.createdAt).getTime() && (
                      <small className="updated-date">
                        Updated: {new Date(record.updatedAt).toLocaleString()}
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
                      Edit Latest Record
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