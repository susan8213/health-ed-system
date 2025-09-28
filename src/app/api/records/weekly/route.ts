import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Patient } from '@/types/user';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection('patients');

    // Calculate this week's date range (Monday to Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start of week
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Find all patients with history records in this week
    const patients = await collection.find(
      {
        'historyRecords.visitDate': {
          $gte: startOfWeek,
          $lte: endOfWeek
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
    console.log('Patients with records this week:', patients);

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