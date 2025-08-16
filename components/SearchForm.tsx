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
    <div className="search-container">
      <h1 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '600' }}>
        TCM Clinic - Patient Search
      </h1>
      <SearchHelp />
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-row">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by name or LINE ID (use spaces for multiple keywords)..."
            className="search-input"
          />
        </div>
        
        <div className="search-row">
          <input
            type="text"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Filter by symptoms (e.g., Headache Fatigue or Headache, Fatigue)..."
            className="search-input"
          />
          
          <input
            type="text"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="Filter by TCM syndromes (e.g., Liver Fire or Liver Fire, Kidney Yang)..."
            className="search-input"
          />
        </div>

        <div className="search-row">
          <div className="search-buttons">
            <button
              type="submit"
              disabled={loading}
              className="search-button"
            >
              {loading ? 'Searching...' : 'Search Patients'}
            </button>
            
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="clear-button"
            >
              Clear
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}