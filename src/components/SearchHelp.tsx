'use client';

import { useState } from 'react';

export default function SearchHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="search-help">
      <button 
        className="help-toggle"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        Search Tips {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="help-content">
          <div className="help-section">
            <h4>Patient Name/LINE ID Search:</h4>
            <ul>
              <li><strong>Single keyword:</strong> "Chen" - finds all patients with "Chen" in name or LINE ID</li>
              <li><strong>Multiple keywords:</strong> "Chen Wei" - finds patients with BOTH "Chen" AND "Wei"</li>
              <li><strong>Partial match:</strong> "che" - finds "Chen", "chenwei123", etc.</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Symptoms & Syndromes Search:</h4>
            <ul>
              <li><strong>Space separated:</strong> "Headache Fatigue" - finds patients with either symptom</li>
              <li><strong>Comma separated:</strong> "Headache, Fatigue" - finds patients with either symptom</li>
              <li><strong>Mixed:</strong> "Headache, Fatigue Insomnia" - finds any of these symptoms</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Search Examples:</h4>
            <ul>
              <li><strong>Find patient:</strong> "Wang Li" (both keywords must match)</li>
              <li><strong>Find symptoms:</strong> "頭痛 失眠" (either symptom)</li>
              <li><strong>Find syndromes:</strong> "Liver Fire" (partial syndrome match)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}