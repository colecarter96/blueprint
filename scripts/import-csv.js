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

async function importFromCSV(csvFilePath) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const videos = [];
    
    // Read CSV file
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean and validate the data
          const video = {
            platform: row.platform?.trim(),
            title: row.title?.trim(),
            user: row.user?.trim(),
            views: parseInt(row.views) || 1000,
            category: row.category?.trim() || 'Lifestyle',
            focus: row.focus?.trim() || 'Tech + Gaming',
            mood: row.mood?.trim() || 'Calm',
            sponsoredContent: row.sponsoredContent?.trim() || null,
            rating: parseInt(row.rating) || 7,
            url: row.url?.trim(),
            instaEmbed: row.instaEmbed?.trim() || ''
          };
          
          // Basic validation
          if (!video.platform || !video.title || !video.user || !video.url) {
            console.warn(`⚠️  Skipping row - missing required fields:`, row);
            return;
          }
          
          videos.push(video);
        })
        .on('end', async () => {
          try {
            if (videos.length === 0) {
              console.log('No valid videos found in CSV');
              resolve();
              return;
            }

            console.log(`Found ${videos.length} videos to import...`);
            
            // Insert all videos
            const result = await Video.insertMany(videos);
            console.log(`✅ Successfully imported ${result.length} videos!`);
            
            // Show summary
            console.log('\n📊 Import Summary:');
            const platformCounts = {};
            videos.forEach(video => {
              platformCounts[video.platform] = (platformCounts[video.platform] || 0) + 1;
            });
            
            Object.entries(platformCounts).forEach(([platform, count]) => {
              console.log(`  ${platform}: ${count} videos`);
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('Error importing videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Get CSV file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.log(`
Usage: node scripts/import-csv.js <path-to-csv-file>

Example: node scripts/import-csv.js videos.csv

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

Download your Google Sheet as CSV and run this script!
  `);
  process.exit(1);
}

// Run the import
importFromCSV(csvFilePath); 