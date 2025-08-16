import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Patient } from '@/types/user';

const samplePatients: Omit<Patient, '_id'>[] = [
  {
    name: '陳偉明',
    lineId: 'chenwei123',
    historyRecords: [
      {
        visitDate: new Date('2025-08-15'),
        symptoms: ['頭痛', '失眠', '眩暈', '煩躁'],
        syndromes: ['肝火上炎', '心火擾神'],
        notes: '患者呈現典型肝火上炎證候，建議調理情志。',
        createdAt: new Date('2025-08-15'),
        updatedAt: new Date('2025-08-15')
      },
      {
        visitDate: new Date('2024-01-29'),
        symptoms: ['輕微頭痛', '睡眠改善'],
        syndromes: ['肝氣鬱結'],
        notes: '症狀有所改善，繼續治療。',
        createdAt: new Date('2024-01-29'),
        updatedAt: new Date('2024-01-29')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '王麗華',
    lineId: 'wanglihua456',
    historyRecords: [
      {
        visitDate: new Date('2025-08-12'),
        symptoms: ['慢性疲勞', '食慾不振', '大便溏薄', '四肢發冷'],
        syndromes: ['脾陽虛', '腎陽虛'],
        notes: '明顯脾陽虛證候，建議溫補治療。',
        createdAt: new Date('2025-08-12'),
        updatedAt: new Date('2025-08-12')
      },
      {
        visitDate: new Date('2024-02-24'),
        symptoms: ['精神改善', '食慾增加', '大便正常'],
        syndromes: ['脾氣虛'],
        notes: '溫補治療效果良好，繼續艾灸。',
        createdAt: new Date('2024-02-24'),
        updatedAt: new Date('2024-02-24')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '林小玉',
    lineId: 'linxiaoyu789',
    historyRecords: [
      {
        visitDate: new Date('2024-01-20'),
        symptoms: ['腰痛', '膝軟無力', '夜尿頻多', '畏寒'],
        syndromes: ['腎陽虛', '下焦虛寒'],
        notes: '腎陽虛伴腰痛，開始艾灸治療。',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '張美玲',
    lineId: 'zhangmeiling321',
    historyRecords: [
      {
        visitDate: new Date('2024-02-05'),
        symptoms: ['月經不調', '乳房脹痛', '情緒波動', '腹脹'],
        syndromes: ['肝氣鬱結', '血瘀'],
        notes: '婦科問題與肝氣鬱結相關，建議針灸治療。',
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05')
      },
      {
        visitDate: new Date('2024-02-19'),
        symptoms: ['月經規律', '乳房脹痛減輕', '情緒穩定'],
        syndromes: ['肝氣條達'],
        notes: '症狀明顯改善，繼續針灸調理。',
        createdAt: new Date('2024-02-19'),
        updatedAt: new Date('2024-02-19')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '劉建國',
    lineId: 'liujianguo654',
    historyRecords: [
      {
        visitDate: new Date('2024-01-25'),
        symptoms: ['慢性咳嗽', '氣短', '喘息', '痰清稀'],
        syndromes: ['肺氣虛', '痰濕'],
        notes: '呼吸系統問題伴肺氣虛，處方中藥。',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '黃小芳',
    lineId: 'huangxiaofang987',
    historyRecords: [
      {
        visitDate: new Date('2024-02-01'),
        symptoms: ['焦慮', '心悸', '煩躁不安', '出汗'],
        syndromes: ['心火', '腎陰虛'],
        notes: '焦慮症伴心火證候，需要安神治療。',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        visitDate: new Date('2024-02-15'),
        symptoms: ['焦慮減輕', '心率平穩', '睡眠改善'],
        syndromes: ['心腎相交'],
        notes: '安神治療進展良好，繼續現有方案。',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function POST() {
  try {
    const db = await getDatabase();
    const collection = db.collection<Patient>('patients');

    // Clear existing patients
    await collection.deleteMany({});

    // Insert sample patients
    const result = await collection.insertMany(samplePatients);

    return NextResponse.json({
      message: '中醫診所患者資料建立成功',
      insertedCount: result.insertedCount
    });
  } catch (error) {
    console.error('Error seeding TCM patients:', error);
    return NextResponse.json(
      { error: '建立患者資料失敗' },
      { status: 500 }
    );
  }
}