'use client';

import { Patient } from '@/types/user';
import Card from './Card';

interface PatientCardProps {
  user: Patient;
  editMode?: boolean;
  isSelected?: boolean;
  onSelect?: (patientId: string, checked: boolean) => void;
}

export default function UserCard({ user: patient, editMode, isSelected, onSelect }: PatientCardProps) {
  const getRecentRecord = () => {
    if (!patient.historyRecords || patient.historyRecords.length === 0) return null;
    return patient.historyRecords
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
  };
  const recentRecord = getRecentRecord();

  // header
  const header = (
      <>
        {patient.lineUserId && onSelect && (
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={(e) => onSelect(patient._id!, e.target.checked)}
            className="patient-checkbox"
          />
        )}
        <h3>{patient.name}</h3>
      </>
  );

  // content
  const content = (
    <>
      <div>
        {recentRecord && (
          <p>
            <label>最近就診：</label> 
            <span>{new Date(recentRecord.visitDate).toLocaleDateString()}</span>
          </p>
        )}
        {patient.historyRecords && patient.historyRecords.length > 0 && !editMode && (
          <p>
            <label>總就診次數：</label> 
            <span>{patient.historyRecords.length}</span>
          </p>
        )}
      </div>
      {recentRecord && recentRecord.symptoms.length > 0 && (
          <div>
            <label>近期症狀：</label>
            
            <div className="keyword-list">
              {recentRecord.symptoms.slice(0, 8).map((symptom, index) => (
                <span key={index} className="keyword-tag">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}
        {recentRecord && recentRecord.syndromes.length > 0 && (
          <div>
            <label>近期證候：</label>
            <div className="keyword-list">
              {recentRecord.syndromes.slice(0, 8).map((syndrome, index) => (
                <span key={index} className="keyword-tag">
                  {syndrome}
                </span>
              ))}
            </div>
          </div>
        )}
    </>
  );

  // footer

  return (
    <Card>
      <Card.Header>{header}</Card.Header>
      <Card.Content>{content}</Card.Content>
      <Card.Footer>
        <a
          href={editMode ? `/edit/${patient._id}` : `/patient/${patient._id}/records`}
          className="button"
        >
          {editMode ? '編輯記錄' : '查看病歷記錄'}
        </a>
      </Card.Footer>
    </Card>
  );
}
