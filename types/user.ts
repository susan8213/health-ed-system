// Simplified TCM Patient Profile
export interface Patient {
  _id?: string;
  // Basic Information
  name: string;
  lineId?: string; // LINE messaging app ID for communication
  
  // Medical History Records
  historyRecords: TCMHistoryRecord[];
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
}

// Simplified TCM History Record
export interface TCMHistoryRecord {
  _id?: string;
  visitDate: Date;
  
  // Symptoms
  symptoms: string[]; // Simple array of symptom names
  
  // TCM Syndromes
  syndromes: string[]; // Simple array of TCM syndrome names
  
  // Optional notes
  notes?: string;
  
  // System Fields
  createdAt: Date;
  updatedAt: Date;
}

// Search and Filter Interfaces
export interface PatientSearchFilters {
  keyword?: string; // Search across name, LINE ID
  symptoms?: string[]; // Filter by symptoms
  syndromes?: string[]; // Filter by TCM syndromes
}

export interface HistoryRecordSearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  symptoms?: string[];
  syndromes?: string[];
}

// For backward compatibility, keep User as alias to Patient
export interface User extends Patient {}

export interface SearchFilters extends PatientSearchFilters {}

// Legacy interfaces for compatibility
export interface MedicalRecord extends TCMHistoryRecord {}
export interface TCMRecord extends TCMHistoryRecord {}