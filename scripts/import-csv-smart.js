const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in your .env file');
  process.exit(1);
}

// Video schema
const videoSchema = new mongoose.Schema({
  platform: String,
  title: String,
  user: String,
  views: Number,
  category: String,
  focus: String,
  mood: String,
  sponsoredContent: String,
  rating: Number,
  url: String,
  instaEmbed: String
});

const Video = mongoose.model('Video', videoSchema);

async function smartImportFromCSV(csvFilePath) {
  let connection;
  
  try {
    console.log('Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const videos = [];
    
    // Read CSV file first, then process
    const csvData = await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // Parse views (handle K, M suffixes)
          let views = 1000;
          if (row.views) {
            const viewStr = row.views.toString().toUpperCase();
            if (viewStr.includes('K')) {
              views = parseInt(parseFloat(viewStr.replace('K', '')) * 1000);
            } else if (viewStr.includes('M')) {
              views = parseInt(parseFloat(viewStr.replace('M', '')) * 1000000);
            } else {
              views = parseInt(viewStr) || 1000;
            }
          }

          // Validate and fix mood values
          let mood = row.mood?.trim() || 'Calm';
          if (mood === 'Relaxed/Calm') mood = 'Calm';
          if (!['Calm', 'High Energy', 'Emotional', 'Funny/Lighthearted', 'Dramatic/Suspenseful'].includes(mood)) {
            mood = 'Calm';
          }

          // Clean and validate the data
          const video = {
            platform: row.platform?.trim(),
            title: row.title?.trim() || `Video by ${row.user?.trim() || 'Unknown'}`,
            user: row.user?.trim(),
            views: views,
            category: row.category?.trim() || 'Lifestyle',
            focus: row.focus?.trim() || 'Tech + Gaming',
            mood: mood,
            sponsoredContent: row.sponsoredContent?.trim() || null,
            rating: parseInt(row.rating) || 7,
            url: row.url?.trim(),
            instaEmbed: row.instaEmbed?.trim() || ''
          };
          
          // Basic validation - only require platform, user, and url
          if (!video.platform || !video.user || !video.url) {
            console.warn(`⚠️  Skipping row - missing required fields:`, {
              platform: video.platform,
              user: video.user,
              url: video.url
            });
            return;
          }
          
          videos.push(video);
        })
        .on('end', () => resolve(videos))
        .on('error', reject);
    });

    if (csvData.length === 0) {
      console.log('No valid videos found in CSV');
      return;
    }

    console.log(`Found ${csvData.length} videos to process...`);
    
    let added = 0;
    let updated = 0;
    let skipped = 0;
    
    // Process each video
    for (const video of csvData) {
      try {
        // Check if video already exists (by URL)
        const existingVideo = await Video.findOne({ url: video.url });
        
        if (existingVideo) {
          // Update existing video
          await Video.updateOne(
            { url: video.url },
            { 
              $set: {
                title: video.title,
                user: video.user,
                views: video.views,
                category: video.category,
                focus: video.focus,
                mood: video.mood,
                sponsoredContent: video.sponsoredContent,
                rating: video.rating,
                instaEmbed: video.instaEmbed,
                updatedAt: new Date()
              }
            }
          );
          updated++;
          console.log(`🔄 Updated: ${video.title}`);
        } else {
          // Add new video
          await Video.create(video);
          added++;
          console.log(`✅ Added: ${video.title}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${video.title}:`, error.message);
        skipped++;
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`  ✅ New videos added: ${added}`);
    console.log(`  🔄 Existing videos updated: ${updated}`);
    console.log(`  ❌ Skipped due to errors: ${skipped}`);
    console.log(`  📝 Total processed: ${csvData.length}`);
    
    // Show platform breakdown
    const platformCounts = {};
    csvData.forEach(video => {
      platformCounts[video.platform] = (platformCounts[video.platform] || 0) + 1;
    });
    
    console.log('\n📱 Platform Breakdown:');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count} videos`);
    });

  } catch (error) {
    console.error('Error importing videos:', error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    }
  }
}

// Get CSV file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.log(`
Usage: node scripts/import-csv-smart.js <path-to-csv-file>

Example: node scripts/import-csv-smart.js videos.csv

This script will:
✅ Add new videos that don't exist
🔄 Update existing videos (matched by URL)
❌ Skip videos with errors
📊 Show detailed summary

CSV should have these columns:
- platform (Youtube, TikTok, Instagram)
- title
- user  
- views (optional, defaults to 1000)
- category (optional, defaults to Lifestyle)
- focus (optional, defaults to Tech + Gaming)
- mood (optional, defaults to Calm)
- sponsoredContent (optional, defaults to null)
- rating (optional, defaults to 7)
- url
- instaEmbed (optional, defaults to empty string)

Perfect for updating your database without duplicates!
  `);
  process.exit(1);
}

// Run the smart import
smartImportFromCSV(csvFilePath); 