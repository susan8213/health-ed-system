'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Patient, TCMHistoryRecord } from '@/types/user';

export default function EditPatientRecord() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestRecord, setLatestRecord] = useState<TCMHistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [symptoms, setSymptoms] = useState<string>('');
  const [syndromes, setSyndromes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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

      // Get the latest record
      if (data.patient.historyRecords && data.patient.historyRecords.length > 0) {
        const latest = data.patient.historyRecords
          .sort((a: TCMHistoryRecord, b: TCMHistoryRecord) => 
            new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
          )[0];
        
        setLatestRecord(latest);
        setSymptoms(latest.symptoms.join(', '));
        setSyndromes(latest.syndromes.join(', '));
        setNotes(latest.notes || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!latestRecord) {
      setError('No record to update');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedRecord = {
        ...latestRecord,
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
        syndromes: syndromes.split(',').map(s => s.trim()).filter(s => s.length > 0),
        notes: notes.trim(),
        updatedAt: new Date()
      };

      const response = await fetch(`/api/users/${patientId}/record`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord),
      });

      if (!response.ok) {
        throw new Error('Failed to update record');
      }

      alert('病歷記錄更新成功！');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">載入患者資料中...</div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="container">
        <div className="error">錯誤: {error}</div>
        <button onClick={handleCancel} className="search-button">
          返回首頁
        </button>
      </div>
    );
  }

  if (!patient || !latestRecord) {
    return (
      <div className="container">
        <div className="no-results">找不到患者或病歷記錄</div>
        <button onClick={handleCancel} className="search-button">
          返回首頁
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="edit-container">
        <div className="edit-header">
          <h1>編輯病歷記錄</h1>
          <div className="patient-info">
            <h2>{patient.name}</h2>
            {patient.lineId && <p>LINE ID: {patient.lineId}</p>}
            <p>就診日期: {new Date(latestRecord.visitDate).toLocaleDateString('zh-TW')}</p>
          </div>
        </div>

        {error && (
          <div className="error">
            錯誤: {error}
          </div>
        )}

        <form onSubmit={handleSave} className="edit-form">
          <div className="form-group">
            <label htmlFor="symptoms">症狀 (以逗號分隔):</label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="例如: 頭痛, 失眠, 眩暈, 煩躁"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="syndromes">證候 (以逗號分隔):</label>
            <textarea
              id="syndromes"
              value={syndromes}
              onChange={(e) => setSyndromes(e.target.value)}
              placeholder="例如: 肝火上炎, 心火擾神"
              className="form-textarea"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">備註:</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="醫師備註..."
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
              className="save-button"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="cancel-button"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}