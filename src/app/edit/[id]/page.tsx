'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
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
      const data = await api.get(`/api/users/${patientId}`);
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
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!latestRecord) {
      setError('沒有記錄可更新');
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

      await api.put(`/api/users/${patientId}/record`, updatedRecord);
      alert('病歷記錄更新成功！');
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
        <button onClick={handleCancel} className="button button-info">
          返回首頁
        </button>
      </div>
    );
  }

  if (!patient || !latestRecord) {
    return (
      <div className="container">
        <div className="no-results">找不到患者或病歷記錄</div>
        <button onClick={handleCancel} className="button button-info">
          返回首頁
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-container">
        <div className="section-header">
          <h1>編輯病歷記錄</h1>
          <div>
            <h2 className='text-color-primary'>{patient.name}</h2>
            {patient.lineUserId && <p>可接收推播 ✓</p>}
            <p>就診日期: {new Date(latestRecord.visitDate).toLocaleDateString('zh-TW')}</p>
          </div>
        </div>

        {error && (
          <div className="error">
            錯誤: {error}
          </div>
        )}

        <form onSubmit={handleSave} className="form">
          <div className="form-group">
            <label htmlFor="symptoms">症狀 (以逗號分隔):</label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="例如: 頭痛, 失眠, 眩暈, 煩躁"
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
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="button button-info"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}