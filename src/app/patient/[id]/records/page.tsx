'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useRouter, useParams } from 'next/navigation';
import { Patient, TCMHistoryRecord } from '@/types/user';
import Card from '@/components/Card';

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
      const data = await api.get(`/api/users/${patientId}`);
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
        <button onClick={handleBack} className="button button-info">
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
      <div className="section-container">
        <div className="section-header">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h1>{patient.name} - 病歷記錄</h1>
            <div className="section-actions">
              <button onClick={handleBack} className="button button-info">
                返回患者搜尋
              </button>
            </div>
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
              <Card key={`${record.visitDate}-${index}`}>
                <Card.Header>
                  <div>
                    <label>問診日期：</label>
                      <span>
                        {new Date(record.visitDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="record-status">
                      {index === 0 && <span className="latest-badge">最新</span>}
                    </div>
                  </Card.Header>
                <Card.Content>
                  <div>
                    <label>更新時間：</label>
                    <small>
                      {new Date(record.updatedAt || record.createdAt).toLocaleString()}
                    </small>
                  </div>
                  {record.symptoms.length > 0 && (
                      <div>
                        <label>近期症狀：</label>
                        
                        <div className="keyword-list">
                          {record.symptoms.slice(0, 8).map((symptom, index) => (
                            <span key={index} className="keyword-tag">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.syndromes.length > 0 && (
                      <div>
                        <label>近期證候：</label>
                        <div className="keyword-list">
                          {record.syndromes.slice(0, 8).map((syndrome, index) => (
                            <span key={index} className="keyword-tag">
                              {syndrome}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.notes && (
                      <div>
                        <label>診療備註：</label>
                        <p>{record.notes}</p>
                      </div>
                    )}
                  </Card.Content>
                  <Card.Footer>
                      {index === 0 && (
                        <div>
                          <a
                            href={`/edit/${patient._id}`}
                            className="button"
                          >
                            編輯最新記錄
                          </a>
                        </div>
                      )}
                  </Card.Footer>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}