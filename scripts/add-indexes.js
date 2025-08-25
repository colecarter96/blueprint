const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in your .env file');
  process.exit(1);
}

async function addIndexes() {
  let connection;
  
  try {
    console.log('Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const db = mongoose.connection.db;
    const videosCollection = db.collection('videos');

    console.log('\nAdding performance indexes...');

    // Compound index for filter combinations (most common queries)
    await videosCollection.createIndex(
      { 
        category: 1, 
        focus: 1, 
        mood: 1, 
        sponsoredContent: 1,
        platform: 1 
      },
      { 
        name: 'filter_compound_idx',
        background: true 
      }
    );
    console.log('✅ Added compound filter index (category, focus, mood, sponsoredContent, platform)');

    // Individual indexes for single-field queries
    await videosCollection.createIndex(
      { category: 1 },
      { 
        name: 'category_idx',
        background: true 
      }
    );
    console.log('✅ Added category index');

    await videosCollection.createIndex(
      { focus: 1 },
      { 
        name: 'focus_idx',
        background: true 
      }
    );
    console.log('✅ Added focus index');

    await videosCollection.createIndex(
      { mood: 1 },
      { 
        name: 'mood_idx',
        background: true 
      }
    );
    console.log('✅ Added mood index');

    await videosCollection.createIndex(
      { sponsoredContent: 1 },
      { 
        name: 'sponsored_content_idx',
        background: true 
      }
    );
    console.log('✅ Added sponsoredContent index');

    await videosCollection.createIndex(
      { platform: 1 },
      { 
        name: 'platform_idx',
        background: true 
      }
    );
    console.log('✅ Added platform index');

    // Compound index for filtering + sorting by creation date
    await videosCollection.createIndex(
      { 
        category: 1,
        focus: 1,
        createdAt: -1 
      },
      { 
        name: 'filter_date_idx',
        background: true 
      }
    );
    console.log('✅ Added filter + date sorting index');

    // Text index for potential future search functionality
    await videosCollection.createIndex(
      { 
        title: 'text',
        user: 'text' 
      },
      { 
        name: 'text_search_idx',
        background: true 
      }
    );
    console.log('✅ Added text search index (title, user)');

    // Index for duplicate detection during imports
    await videosCollection.createIndex(
      { url: 1 },
      { 
        name: 'url_idx',
        background: true,
        sparse: true // Only index documents that have a URL
      }
    );
    console.log('✅ Added URL index for import deduplication');

    console.log('\n🎉 All indexes created successfully!');
    console.log('\nIndex summary:');
    console.log('- Compound filter index: Fast multi-filter queries');
    console.log('- Individual field indexes: Fast single-filter queries');
    console.log('- Date sorting index: Fast chronological filtering');
    console.log('- Text search index: Future search functionality');
    console.log('- URL index: Fast duplicate detection');

    // Show current indexes
    console.log('\nCurrent indexes:');
    const indexes = await videosCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('Failed to add indexes:', error);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('\nMongoDB connection closed.');
    }
  }
}

// Run the indexing
console.log('🚀 Starting database indexing for performance optimization...');
addIndexes();