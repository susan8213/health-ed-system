import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Patient } from '@/types/user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const symptoms = searchParams.get('symptoms');
    const conditions = searchParams.get('conditions');
    const gender = searchParams.get('gender');
    const status = searchParams.get('status');

    const db = await getDatabase();
    const collection = db.collection<Patient>('patients');

    // Build search query
    let query: any = {};

    if (keyword) {
      // Split keywords by space and create search conditions
      const keywords = keyword.trim().split(/\s+/).filter(k => k.length > 0);
      
      if (keywords.length === 1) {
        // Single keyword search
        query.$or = [
          { name: { $regex: keywords[0], $options: 'i' } },
          { lineId: { $regex: keywords[0], $options: 'i' } }
        ];
      } else {
        // Multiple keywords search - all keywords must match in any field
        query.$and = keywords.map(kw => ({
          $or: [
            { name: { $regex: kw, $options: 'i' } },
            { lineId: { $regex: kw, $options: 'i' } }
          ]
        }));
      }
    }

    if (symptoms) {
      // Enhanced symptoms search - support both comma and space separation
      const symptomsArray = symptoms.split(/[,\s]+/).map(symptom => symptom.trim()).filter(s => s.length > 0);
      if (symptomsArray.length > 0) {
        query['historyRecords.symptoms'] = { 
          $in: symptomsArray.map(symptom => new RegExp(symptom, 'i')) 
        };
      }
    }

    if (conditions) {
      // Enhanced syndromes search - support both comma and space separation
      const conditionsArray = conditions.split(/[,\s]+/).map(condition => condition.trim()).filter(c => c.length > 0);
      if (conditionsArray.length > 0) {
        query['historyRecords.syndromes'] = { 
          $in: conditionsArray.map(condition => new RegExp(condition, 'i')) 
        };
      }
    }

    // No status filter in simplified schema

    const patients = await collection.find(query).limit(50).toArray();

    return NextResponse.json({ users: patients, count: patients.length });
  } catch (error) {
    console.error('Error searching patients:', error);
    return NextResponse.json(
      { error: 'Failed to search patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const patientData: Omit<Patient, '_id'> = await request.json();
    
    const db = await getDatabase();
    const collection = db.collection<Patient>('patients');

    // No patient ID generation needed

    const newPatient = {
      ...patientData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newPatient);

    return NextResponse.json(
      { message: 'Patient created successfully', patientId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}