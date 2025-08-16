#!/usr/bin/env node

/**
 * Database Setup Script for Cloud MongoDB
 * Run this script to initialize indexes and collections in your cloud MongoDB instance
 * 
 * Usage: node scripts/setup-database.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function setupDatabase() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'tcm-clinic';

  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');

    const db = client.db(dbName);
    const patientsCollection = db.collection('patients');

    console.log('📊 Creating indexes for optimal performance...');

    // Create indexes for better performance
    const indexes = [
      // Text search index for name and lineId
      { key: { name: 'text', lineId: 'text' }, name: 'text_search_index' },
      
      // Individual field indexes
      { key: { lineId: 1 }, name: 'lineId_index' },
      { key: { 'historyRecords.visitDate': -1 }, name: 'visit_date_index' },
      { key: { 'historyRecords.symptoms': 1 }, name: 'symptoms_index' },
      { key: { 'historyRecords.syndromes': 1 }, name: 'syndromes_index' },
      { key: { createdAt: -1 }, name: 'created_at_index' },
      { key: { updatedAt: -1 }, name: 'updated_at_index' },
      
      // Compound indexes for common queries
      { key: { status: 1, createdAt: -1 }, name: 'status_created_index' },
      { key: { 'historyRecords.visitDate': -1, 'historyRecords.symptoms': 1 }, name: 'visit_symptoms_index' }
    ];

    for (const index of indexes) {
      try {
        await patientsCollection.createIndex(index.key, { name: index.name });
        console.log(`✅ Created index: ${index.name}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`ℹ️  Index already exists: ${index.name}`);
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message);
        }
      }
    }

    // Check if collection exists and has data
    const count = await patientsCollection.countDocuments();
    console.log(`📋 Current patient count: ${count}`);

    if (count === 0) {
      console.log('💡 Database is empty. You can seed sample data using the application UI.');
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your application: docker-compose up -d');
    console.log('2. Access the app at: http://localhost:3000');
    console.log('3. Click "Seed Sample Data" to add test patients');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupDatabase().catch(console.error);