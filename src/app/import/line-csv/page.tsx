'use client';

import React, { useState } from 'react';

type PreviewResult = {
  ok: boolean;
  meta?: { weeks: number; messages: number; ignored: number };
  patient?: {
    name: string;
    lineUserId?: string;
    historyRecords: { visitDate: string; symptoms: string[]; syndromes: string[] }[];
  };
  error?: string;
};

export default function ImportLineCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [lineUserId, setLineUserId] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [rows, setRows] = useState<
    {
      included: boolean;
      visitDate: string; // ISO or date string
      symptomsText: string; // comma-separated for editing
      syndromesText: string; // comma-separated for editing
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreview(null);
    setSuccessMsg(null);
    setError(null);
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  async function requestPreview() {
    if (!file) {
      setError('請選擇 CSV 檔');
      return;
    }
    setLoading(true);
    setError(null);
    setPreview(null);
    setSuccessMsg(null);

    try {
      const form = new FormData();
      form.append('file', file);
      const qs = new URLSearchParams();
      if (name) qs.set('name', name);
      if (lineUserId) qs.set('lineUserId', lineUserId);
      const res = await fetch(`/api/import/line-csv?${qs.toString()}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPreview(data);
      // 初始化可編輯列
      const editable = (data.patient?.historyRecords || []).map((rec: any) => ({
        included: true,
        visitDate: rec.visitDate,
        symptomsText: (rec.symptoms || []).join(', '),
        syndromesText: (rec.syndromes || []).join(', '),
      }));
      setRows(editable);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirmInsert() {
    if (!file) {
      setError('請選擇 CSV 檔');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const form = new FormData();
      // 可同時附上原檔案（保留後端可能需要的資訊），也可以僅傳 overrides
      form.append('file', file);
      const qs = new URLSearchParams();
      if (name) qs.set('name', name);
      if (lineUserId) qs.set('lineUserId', lineUserId);
      qs.set('upsert', 'true');

      // overrides 加上 name，優先用 input，沒填則自動帶 preview.patient.name
      const overrides = {
        name: name.trim() ? name.trim() : (preview?.patient?.name ?? ''),
        historyRecords: rows
          .filter(r => r.included)
          .map(r => ({
            visitDate: r.visitDate,
            symptoms: r.symptomsText
              .split(/,|，|、/)
              .map(t => t.trim())
              .filter(Boolean),
            syndromes: r.syndromesText
              .split(/,|，|、/)
              .map(t => t.trim())
              .filter(Boolean),
          })),
      };
      form.append('overrides', JSON.stringify(overrides));

      const res = await fetch(`/api/import/line-csv?${qs.toString()}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSuccessMsg(
        data.upsert?.upserted
          ? `已建立新病患，ID: ${data.upsert.patientId}`
          : `已更新病患，ID: ${data.upsert?.patientId}`
      );
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '16px' }}>
      <h1>匯入 LINE CSV</h1>
      <p>上傳 LINE 對話 CSV，系統將依週（週一起）彙整 Keywords 與中醫診斷輔助，預覽後再確認寫入。</p>

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label htmlFor="csv">CSV 檔案</label>
              <input id="csv" name="csv" type="file" accept=".csv,text/csv" onChange={onSelect} />
            </div>
            <div>
              <label htmlFor="name">病患名稱（可選）</label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：田文明"
              />
            </div>
            <div>
              <label htmlFor="lineUserId">LINE User ID（可選）</label>
              <input
                id="lineUserId"
                name="lineUserId"
                type="text"
                value={lineUserId}
                onChange={(e) => setLineUserId(e.target.value)}
                placeholder="Uxxxxxxxxxxx"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={requestPreview} disabled={loading}>
              {loading ? '處理中…' : '預覽轉換'}
            </button>
            <button type="button" onClick={confirmInsert} disabled={loading || !preview}>
              {loading ? '寫入中…' : '確認寫入 DB'}
            </button>
            <button
              type="button"
              onClick={() => {
                // 預設插入今天所在週的週一
                const today = new Date();
                const day = today.getDay();
                const diff = day === 0 ? -6 : 1 - day; // Monday start
                const monday = new Date(today);
                monday.setHours(0, 0, 0, 0);
                monday.setDate(monday.getDate() + diff);
                const iso = monday.toISOString();
                setRows((prev) => [
                  ...prev,
                  { included: true, visitDate: iso, symptomsText: '', syndromesText: '' },
                ]);
              }}
              disabled={loading}
            >
              新增一週
            </button>
          </div>
        </form>
      </div>
      {error && (
        <div style={{ color: 'crimson', marginTop: 8 }}>錯誤：{error}</div>
      )}
      {successMsg && (
        <div style={{ color: 'green', marginTop: 8 }}>{successMsg}</div>
      )}

      {preview && preview.ok && preview.patient && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h2>預覽：{preview.patient.name}</h2>
          <p>
            解析結果 - 週數：{preview.meta?.weeks ?? 0}，採納訊息：{preview.meta?.messages ?? 0}，忽略：{preview.meta?.ignored ?? 0}
          </p>
          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <div style={{ overflow: 'auto', maxHeight: '60vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <colgroup>
                  <col style={{ width: 32 }} />
                </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', borderBottom: '1px solid #ddd', padding: 6, width: 32, minWidth: 32 }}>
                    <label>包含</label>
                  </th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                    <label>週起始（週一）</label>
                  </th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                    <label>症狀 (symptoms)</label>
                  </th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                    <label>證候 (syndromes)</label>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ borderBottom: '1px solid #eee', padding: 6, width: 32, minWidth: 32, textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={(e) => {
                          const nv = [...rows];
                          nv[idx] = { ...nv[idx], included: e.target.checked };
                          setRows(nv);
                        }}
                      />
                    </span>
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    <input
                      type="date"
                      value={(() => {
                        const d = new Date(row.visitDate);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${yyyy}-${mm}-${dd}`;
                      })()}
                      onChange={(e) => {
                        const v = e.target.value; // yyyy-mm-dd
                        const iso = new Date(v + 'T00:00:00').toISOString();
                        const nv = [...rows];
                        nv[idx] = { ...nv[idx], visitDate: iso };
                        setRows(nv);
                      }}
                    />
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    <input
                      type="text"
                      value={row.symptomsText}
                      onChange={(e) => {
                        const nv = [...rows];
                        nv[idx] = { ...nv[idx], symptomsText: e.target.value };
                        setRows(nv);
                      }}
                      placeholder="以逗號分隔，例如：抽筋, 肩頸緊繃"
                      style={{ width: 320, maxWidth: 480 }}
                    />
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    <input
                      type="text"
                      value={row.syndromesText}
                      onChange={(e) => {
                        const nv = [...rows];
                        nv[idx] = { ...nv[idx], syndromesText: e.target.value };
                        setRows(nv);
                      }}
                      placeholder="以逗號分隔，例如：肝腎虧虛, 氣滯血瘀"
                      style={{ width: 320, maxWidth: 480 }}
                    />
                  </td>
                </tr>
              ))}
              </tbody>
              </table>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
