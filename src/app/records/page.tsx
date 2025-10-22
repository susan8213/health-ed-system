'use client';

import { useState, useEffect } from 'react';
import { Patient, TCMHistoryRecord } from '@/types/user';
import WordCloud from '@/components/WordCloud';
import StatisticGroup from '@/components/StatisticGroup';
import StatisticCard from '@/components/StatisticCard';
import CollapsibleSection from '@/components/CollapsibleSection';
import { generateWordCloudData, generateMockWordCloudData, WordCloudItem } from '@/utils/wordcloud';
import UserCard from '@/components/UserCard';

interface RecordWithPatient extends TCMHistoryRecord {
  patientName: string;
  patientLineId?: string;
  patientId: string;
}

export default function WeeklyRecords() {

  // 狀態：週期選擇（週日為起始）
  function getSundayOf(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function getNextSaturday(sunday: Date) {
    const d = new Date(sunday);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  const [weekStart, setWeekStart] = useState(() => getSundayOf(new Date()));
  const [weekEnd, setWeekEnd] = useState(() => getNextSaturday(getSundayOf(new Date())));
  const [records, setRecords] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordCloudData, setWordCloudData] = useState<WordCloudItem[]>([]);

  useEffect(() => {
    fetchWeeklyRecords(weekStart, weekEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime(), weekEnd.getTime()]);

  const fetchWeeklyRecords = async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const qs = `?start=${start.toISOString().slice(0,10)}&end=${end.toISOString().slice(0,10)}`;
      const response = await fetch(`/api/records/weekly${qs}`);
      if (!response.ok) {
        throw new Error('獲取週記錄失敗');
      }
      const data = await response.json();
      setRecords(data.records);
      const cloudData = generateWordCloudData(data.records.map((record: Patient) => record.historyRecords).flat());
      setWordCloudData(cloudData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };


  // 日期 input 事件

  // 切換週數（以週日為起始）
  const gotoPrevWeek = () => {
    const prevSunday = new Date(weekStart);
    prevSunday.setDate(prevSunday.getDate() - 7);
    setWeekStart(getSundayOf(prevSunday));
    setWeekEnd(getNextSaturday(getSundayOf(prevSunday)));
  };
  const gotoNextWeek = () => {
    const nextSunday = new Date(weekStart);
    nextSunday.setDate(nextSunday.getDate() + 7);
    setWeekStart(getSundayOf(nextSunday));
    setWeekEnd(getNextSaturday(getSundayOf(nextSunday)));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">載入週記錄中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">錯誤: {error}</div>
        <a href="/" className="button button-info">返回患者搜尋</a>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="records-container">
        <div className="records-header">
          <h1>問診記錄</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <button type="button" onClick={gotoPrevWeek} style={{ fontSize: 20, padding: '2px 10px' }}>&lt;</button>
            <span style={{ fontWeight: 500, fontSize: 18 }}>
              {weekStart.toLocaleDateString()}(週日) ～ {weekEnd.toLocaleDateString()}(週六)
            </span>
            <button type="button" onClick={gotoNextWeek} style={{ fontSize: 20, padding: '2px 10px' }}>&gt;</button>
          </div>
        </div>

        {/* 可摺疊統計與文字雲區塊 */}
        <CollapsibleSection title="本週統計" defaultOpen>
          <StatisticGroup>
            <StatisticCard title="問診人數" count={records.length} />
            {/* <StatisticCard title="問診訊息數" count={0} /> */}
            <StatisticCard title="關鍵字數量" count={wordCloudData.length} />
          </StatisticGroup>
          <div className="word-cloud-section">
            <h2>常見症狀</h2>
            <div className="word-cloud-wrapper">
              <WordCloud 
                data={wordCloudData}
                width={640}
                height={480}
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="問診紀錄明細" defaultOpen>
          {records.length === 0 ? (
            <div className="no-results">
              此週沒有找到問診記錄。
            </div>
          ) : (
            <div className="section-container">
              <div className="section-header">
                此週找到 {records.length} 筆記錄
              </div>
              {records.map((record, index) => (
                <UserCard
                  key={record._id}
                  user={record}
                  editMode={
                    weekStart.toDateString() === getSundayOf(new Date()).toDateString()
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}