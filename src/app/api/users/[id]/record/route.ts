import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Patient, TCMHistoryRecord } from '@/types/user';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updatedRecord: TCMHistoryRecord = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('patients');

    // First, get the patient to find the latest record
    const patient = await collection.findOne({ _id: new ObjectId(id) }) as Patient | null;

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (!patient.historyRecords || patient.historyRecords.length === 0) {
      return NextResponse.json(
        { error: 'No history records found' },
        { status: 404 }
      );
    }

    // Find the latest record (most recent visitDate)
    const latestRecord = patient.historyRecords
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

    // Update the latest record in the array
    const result = await collection.updateOne(
      { 
        _id: new ObjectId(id),
        'historyRecords.visitDate': latestRecord.visitDate
      },
      {
        $set: {
          'historyRecords.$.symptoms': updatedRecord.symptoms,
          'historyRecords.$.syndromes': updatedRecord.syndromes,
          'historyRecords.$.notes': updatedRecord.notes,
          'historyRecords.$.updatedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update record' },
        { status: 404 }
      );
    }

    // 清除相關的快取
    revalidatePath('/api/users');
    revalidatePath(`/api/users/${id}`);
    revalidatePath('/api/records/weekly');
    // revalidatePath('/'); // CSR 頁面不需要
    // revalidatePath('/records'); // 如果也是 CSR 就不需要

    return NextResponse.json({
      message: 'Record updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating patient record:', error);
    return NextResponse.json(
      { error: 'Failed to update patient record' },
      { status: 500 }
    );
  }
}