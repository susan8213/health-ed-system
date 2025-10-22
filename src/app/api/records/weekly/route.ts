import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Patient } from '@/types/user';

// export const revalidate = 86400; // 24 小時
export const revalidate = 0; // 禁用 ISR，確保每次請求都獲取最新數據
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('patients');

    // 支援自訂週期：query string start/end（ISO 日期）
    const { searchParams } = new URL(req.url);
    let startStr = searchParams.get('start');
    let endStr = searchParams.get('end');
    console.log('Received weekly records request with params:', { start: startStr, end: endStr });

    let startOfWeek: Date;
    let endOfWeek: Date;
    if (startStr && endStr) {
      startOfWeek = new Date(startStr);
      endOfWeek = new Date(endStr);
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek.setHours(23, 59, 59, 999);
    } else {
      // 預設本週週日
      const now = new Date();
      startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Sunday as start of week
      startOfWeek.setDate(now.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
    }

    // Find all patients with history records in this week/custom range
    const patients = await collection.find(
      {
        historyRecords: {
          $elemMatch: {
            visitDate: {
              $gte: startOfWeek,
              $lte: endOfWeek
            }
          } 
        }
      },
      {
        projection: {
          name: 1,
          lineId: 1,
          historyRecords: {
            $elemMatch: {
              visitDate: { $gte: startOfWeek, $lte: endOfWeek }
            }
          }
        }
      }
    )
    .sort({ 'historyRecords.visitDate': -1 }) // Sort by most recent visitDate first
    .toArray();
    console.log(`Patients with records in range (${startOfWeek.toISOString()} - ${endOfWeek.toISOString()}):`, patients);

    const typedPatients = patients as unknown as Patient[];

    return NextResponse.json({
      records: typedPatients,
      count: typedPatients.length,
      weekRange: {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching weekly records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly records' },
      { status: 500 }
    );
  }
}