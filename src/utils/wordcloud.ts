import { TCMHistoryRecord } from '@/types/user';

export interface WordCloudItem {
  text: string;
  weight: number;
  category: 'symptom' | 'syndrome';
}

interface RecordWithPatient extends TCMHistoryRecord {
  patientName: string;
  patientLineId?: string;
  patientId: string;
}

/**
 * 從病歷記錄中提取症狀和證候，生成文字雲數據
 */
export function generateWordCloudData(records: RecordWithPatient[]): WordCloudItem[] {
  const symptomCount: { [key: string]: number } = {};
  const syndromeCount: { [key: string]: number } = {};

  // 統計症狀和證候出現頻率
  records.forEach(record => {
    // 統計症狀
    record.symptoms.forEach(symptom => {
      symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
    });

    // 統計證候
    record.syndromes.forEach(syndrome => {
      syndromeCount[syndrome] = (syndromeCount[syndrome] || 0) + 1;
    });
  });

  // 轉換為文字雲格式
  const wordCloudData: WordCloudItem[] = [];

  // 添加症狀數據
  Object.entries(symptomCount).forEach(([symptom, count]) => {
    wordCloudData.push({
      text: symptom,
      weight: count,
      category: 'symptom'
    });
  });

  // 添加證候數據
  Object.entries(syndromeCount).forEach(([syndrome, count]) => {
    wordCloudData.push({
      text: syndrome,
      weight: count,
      category: 'syndrome'
    });
  });

  // 按權重排序，取前20個
  return wordCloudData
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20);
}

/**
 * 生成測試用的文字雲數據
 */
export function generateMockWordCloudData(): WordCloudItem[] {
  const mockSymptoms = [
    // { text: '頭痛', weight: 12, category: 'symptom' as const },
    // { text: '失眠', weight: 8, category: 'symptom' as const },
    { text: '眩暈', weight: 6, category: 'symptom' as const },
    // { text: '疲勞', weight: 10, category: 'symptom' as const },
    // { text: '咳嗽', weight: 7, category: 'symptom' as const },
    // { text: '胸悶', weight: 5, category: 'symptom' as const },
    { text: '腹痛', weight: 1, category: 'symptom' as const },
    { text: '心悸', weight: 6, category: 'symptom' as const }
  ];

  const mockSyndromes = [
    { text: '肝火旺盛', weight: 15, category: 'syndrome' as const },
    { text: '心火擾神', weight: 9, category: 'syndrome' as const },
    // { text: '腎陽虛', weight: 7, category: 'syndrome' as const },
    // { text: '脾胃虛弱', weight: 8, category: 'syndrome' as const },
    // { text: '肺氣虛', weight: 5, category: 'syndrome' as const },
    { text: '血瘀', weight: 6, category: 'syndrome' as const }
  ];

  return [...mockSymptoms, ...mockSyndromes]
    .sort((a, b) => b.weight - a.weight);
}
