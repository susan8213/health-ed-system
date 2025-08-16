'use client';

import { Patient } from '@/types/user';

interface PatientCardProps {
  user: Patient;
  isSelected?: boolean;
  onSelect?: (patientId: string, checked: boolean) => void;
}

export default function UserCard({ user: patient, isSelected, onSelect }: PatientCardProps) {
  const getRecentRecord = () => {
    if (!patient.historyRecords || patient.historyRecords.length === 0) return null;
    
    return patient.historyRecords
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
  };

  const recentRecord = getRecentRecord();

  return (
    <div className="user-card">
      <div className="patient-header">
        <div className="patient-name-section">
          {patient.lineId && onSelect && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => onSelect(patient._id!, e.target.checked)}
              className="patient-checkbox"
            />
          )}
          <h3 className="user-name">{patient.name}</h3>
        </div>
      </div>
      
      <div className="patient-basic-info">
        {patient.lineId && (
          <p className="line-id">LINE: {patient.lineId}</p>
        )}
      </div>
      
      <div className="user-details">
        {recentRecord && (
          <div className="recent-visit">
            <strong>Last Visit:</strong> {new Date(recentRecord.visitDate).toLocaleDateString()}
          </div>
        )}

        {recentRecord && recentRecord.symptoms.length > 0 && (
          <div className="recent-symptoms">
            <strong>Recent Symptoms:</strong>
            <div className="symptoms-list">
              {recentRecord.symptoms.slice(0, 4).map((symptom, index) => (
                <span key={index} className="symptom-tag">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        {recentRecord && recentRecord.syndromes.length > 0 && (
          <div className="recent-syndromes">
            <strong>Recent Syndromes:</strong>
            <div className="syndromes-list">
              {recentRecord.syndromes.map((syndrome, index) => (
                <span key={index} className="syndrome-tag">
                  {syndrome}
                </span>
              ))}
            </div>
          </div>
        )}

        {patient.historyRecords && patient.historyRecords.length > 0 && (
          <div className="visit-count">
            <strong>Total Visits:</strong> {patient.historyRecords.length}
          </div>
        )}

        <div className="card-actions">
          <a 
            href={`/patient/${patient._id}/records`}
            className="records-button"
          >
            View Patient Records
          </a>
        </div>
      </div>
    </div>
  );
}
