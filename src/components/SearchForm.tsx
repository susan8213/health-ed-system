'use client';

import { useState } from 'react';
import SearchHelp from './SearchHelp';

interface SearchFormProps {
  onSearch: (filters: {
    keyword?: string;
    symptoms?: string;
    conditions?: string;
  }) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [conditions, setConditions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword: keyword.trim() || undefined,
      symptoms: symptoms.trim() || undefined,
      conditions: conditions.trim() || undefined
    });
  };

  const handleClear = () => {
    setKeyword('');
    setSymptoms('');
    setConditions('');
    onSearch({});
  };

  return (
    <div className="section-container">
      <h1 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '600' }}>
        智慧醫療管理系統 - 患者搜尋
      </h1>
      <SearchHelp />
      <form onSubmit={handleSubmit} className="form">
        <div className="row">
          <div className="column form-group">
            <label htmlFor="keyword">搜尋患者:</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="按患者姓名搜尋（使用空格分隔多個關鍵字）..."
              className="search-input"
            />
          </div>
          <div className="column form-group">
            <label htmlFor="symptoms">症狀篩選:</label>
            <input
              type="text"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="按症狀篩選（例如：頭痛 疲勞）..."
              className="search-input"
            />
          </div>
          <div className="column form-group">
            <label htmlFor="conditions">中醫證候篩選:</label>
            <input
              type="text"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="按中醫證候篩選（例如：肝火旺盛）..."
              className="search-input"
            />
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end'}}>
            <button
              type="submit"
              disabled={loading}
            >
              {loading ? '搜尋中...' : '搜尋患者'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="button-info"
            >
              清除
            </button>
        </div>
      </form>
    </div>
  );
}