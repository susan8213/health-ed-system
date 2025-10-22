import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Patient } from '@/types/user';

const samplePatients: Omit<Patient, '_id'>[] = [
  {
    name: '潘志豪',
    historyRecords: [
      {
        visitDate: new Date('2025-09-29'),
        symptoms: ['耳鳴', '頭暈', '失眠'],
        syndromes: ['腎虛', '肝陽上亢'],
        notes: '耳鳴伴頭暈失眠，腎虛肝陽亢盛。',
        createdAt: new Date('2025-09-29'),
        updatedAt: new Date('2025-09-29')
      },
      {
        visitDate: new Date('2025-10-06'),
        symptoms: ['耳鳴減輕', '睡眠改善'],
        syndromes: ['腎氣恢復'],
        notes: '腎氣恢復，耳鳴明顯減輕。',
        createdAt: new Date('2025-10-06'),
        updatedAt: new Date('2025-10-06')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '高文彬',
    historyRecords: [
      {
        visitDate: new Date('2025-09-27'),
        symptoms: ['腹瀉', '腹痛', '口乾'],
        syndromes: ['脾胃濕熱'],
        notes: '脾胃濕熱導致腹瀉，建議清熱利濕。',
        createdAt: new Date('2025-09-27'),
        updatedAt: new Date('2025-09-27')
      },
      {
        visitDate: new Date('2025-10-04'),
        symptoms: ['腹痛減輕', '食慾改善'],
        syndromes: ['脾胃調和'],
        notes: '症狀改善，繼續調理脾胃。',
        createdAt: new Date('2025-10-04'),
        updatedAt: new Date('2025-10-04')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '曾雅雯',
    historyRecords: [
      {
        visitDate: new Date('2025-09-29'),
        symptoms: ['頭痛', '肩頸僵硬'],
        syndromes: ['風寒'],
        notes: '風寒入侵導致頭痛，建議祛風散寒。',
        createdAt: new Date('2025-09-29'),
        updatedAt: new Date('2025-09-29')
      },
      {
        visitDate: new Date('2025-10-06'),
        symptoms: ['頭痛消失', '肩頸放鬆'],
        syndromes: ['氣血調和'],
        notes: '症狀消失，繼續調理氣血。',
        createdAt: new Date('2025-10-06'),
        updatedAt: new Date('2025-10-06')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '鄭凱翔',
    historyRecords: [
      {
        visitDate: new Date('2025-09-30'),
        symptoms: ['咳嗽', '鼻塞', '流鼻水'],
        syndromes: ['風寒感冒'],
        notes: '風寒感冒，建議祛風解表。',
        createdAt: new Date('2025-09-30'),
        updatedAt: new Date('2025-09-30')
      },
      {
        visitDate: new Date('2025-10-07'),
        symptoms: ['咳嗽減輕', '鼻塞消失'],
        syndromes: ['肺氣恢復'],
        notes: '症狀改善，繼續調理肺氣。',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '傅美珍',
    historyRecords: [
      {
        visitDate: new Date('2025-09-28'),
        symptoms: ['失眠', '心煩', '口苦'],
        syndromes: ['心火旺盛'],
        notes: '心火旺盛導致失眠，建議清心火。',
        createdAt: new Date('2025-09-28'),
        updatedAt: new Date('2025-09-28')
      },
      {
        visitDate: new Date('2025-10-05'),
        symptoms: ['睡眠改善', '心煩減輕'],
        syndromes: ['心火調和'],
        notes: '症狀改善，繼續調理心火。',
        createdAt: new Date('2025-10-05'),
        updatedAt: new Date('2025-10-05')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '賴俊宏',
    historyRecords: [
      {
        visitDate: new Date('2025-09-26'),
        symptoms: ['腰痛', '膝蓋痠軟'],
        syndromes: ['腎虛'],
        notes: '腎虛導致腰膝痠軟，建議補腎。',
        createdAt: new Date('2025-09-26'),
        updatedAt: new Date('2025-09-26')
      },
      {
        visitDate: new Date('2025-10-03'),
        symptoms: ['腰痛減輕', '膝蓋有力'],
        syndromes: ['腎氣恢復'],
        notes: '症狀改善，繼續補腎。',
        createdAt: new Date('2025-10-03'),
        updatedAt: new Date('2025-10-03')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '蘇怡萱',
    historyRecords: [
      {
        visitDate: new Date('2025-09-25'),
        symptoms: ['頭暈', '疲倦', '食慾不振'],
        syndromes: ['脾虛', '氣血不足'],
        notes: '脾虛導致頭暈疲倦，建議健脾益氣。',
        createdAt: new Date('2025-09-25'),
        updatedAt: new Date('2025-09-25')
      },
      {
        visitDate: new Date('2025-10-02'),
        symptoms: ['精神好轉', '食慾改善'],
        syndromes: ['脾氣恢復'],
        notes: '症狀改善，繼續調理脾氣。',
        createdAt: new Date('2025-10-02'),
        updatedAt: new Date('2025-10-02')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 2025/9 ~ 10月測試資料
  {
    name: '李志強',
    historyRecords: [
      {
        visitDate: new Date('2025-09-28'),
        symptoms: ['咳嗽', '喉嚨痛', '痰多'],
        syndromes: ['肺熱', '痰濕阻絡'],
        notes: '秋季咳嗽加重，建議清熱化痰。',
        createdAt: new Date('2025-09-28'),
        updatedAt: new Date('2025-09-28')
      },
      {
        visitDate: new Date('2025-10-05'),
        symptoms: ['咳嗽減輕', '喉嚨癢'],
        syndromes: ['肺氣虛'],
        notes: '症狀改善，繼續調理肺氣。',
        createdAt: new Date('2025-10-05'),
        updatedAt: new Date('2025-10-05')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '周雅婷',
    historyRecords: [
      {
        visitDate: new Date('2025-09-30'),
        symptoms: ['頭暈', '疲倦', '食慾不振'],
        syndromes: ['脾虛', '氣血不足'],
        notes: '脾虛導致食慾不振，建議健脾益氣。',
        createdAt: new Date('2025-09-30'),
        updatedAt: new Date('2025-09-30')
      },
      {
        visitDate: new Date('2025-10-07'),
        symptoms: ['精神好轉', '食慾改善'],
        syndromes: ['脾氣恢復'],
        notes: '脾氣恢復，繼續調理。',
        createdAt: new Date('2025-10-07'),
        updatedAt: new Date('2025-10-07')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '吳明哲',
    historyRecords: [
      {
        visitDate: new Date('2025-09-25'),
        symptoms: ['腰痛', '下肢無力'],
        syndromes: ['腎虛', '筋脈失養'],
        notes: '腎虛導致腰痛，下肢乏力。',
        createdAt: new Date('2025-09-25'),
        updatedAt: new Date('2025-09-25')
      },
      {
        visitDate: new Date('2025-10-02'),
        symptoms: ['腰痛減輕', '步行穩定'],
        syndromes: ['腎氣恢復'],
        notes: '腎氣恢復，繼續補腎。',
        createdAt: new Date('2025-10-02'),
        updatedAt: new Date('2025-10-02')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '陳怡君',
    historyRecords: [
      {
        visitDate: new Date('2025-09-29'),
        symptoms: ['失眠', '心悸', '焦慮'],
        syndromes: ['心脾兩虛'],
        notes: '心脾兩虛導致失眠，建議養心安神。',
        createdAt: new Date('2025-09-29'),
        updatedAt: new Date('2025-09-29')
      },
      {
        visitDate: new Date('2025-10-06'),
        symptoms: ['睡眠改善', '心悸減輕'],
        syndromes: ['心脾調和'],
        notes: '症狀改善，繼續調理。',
        createdAt: new Date('2025-10-06'),
        updatedAt: new Date('2025-10-06')
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '陳偉明',
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