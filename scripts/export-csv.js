const mongoose = require('mongoose');
const fs = require('fs');
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

async function exportToCSV(outputFilePath) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Fetch all videos
    console.log('Fetching videos from database...');
    const videos = await Video.find({}).sort({ createdAt: -1 });
    
    if (videos.length === 0) {
      console.log('No videos found in database');
      return;
    }

    console.log(`Found ${videos.length} videos to export...`);

    // Create CSV content
    const headers = 'platform,title,user,views,category,focus,mood,sponsoredContent,rating,url,instaEmbed\n';
    
    const csvRows = videos.map(video => {
      return [
        video.platform || '',
        `"${(video.title || '').replace(/"/g, '""')}"`, // Escape quotes in title
        video.user || '',
        video.views || 0,
        video.category || '',
        video.focus || '',
        video.mood || '',
        video.sponsoredContent || '',
        video.rating || 0,
        video.url || '',
        `"${(video.instaEmbed || '').replace(/"/g, '""')}"` // Escape quotes in embed
      ].join(',');
    });

    const csvContent = headers + csvRows.join('\n');

    // Write to file
    fs.writeFileSync(outputFilePath, csvContent, 'utf8');
    
    console.log(`✅ Successfully exported ${videos.length} videos to ${outputFilePath}`);
    
    // Show summary
    console.log('\n📊 Export Summary:');
    const platformCounts = {};
    videos.forEach(video => {
      platformCounts[video.platform] = (platformCounts[video.platform] || 0) + 1;
    });
    
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count} videos`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('  1. Open the CSV file in Google Sheets');
    console.log('  2. Edit/add videos as needed');
    console.log('  3. Export as CSV from Google Sheets');
    console.log('  4. Import back using: node scripts/import-csv-smart.js updated-videos.csv');

  } catch (error) {
    console.error('Error exporting videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Get output file path from command line or use default
const outputFilePath = process.argv[2] || 'exported-videos.csv';

console.log(`Exporting videos to: ${outputFilePath}`);

// Run the export
exportToCSV(outputFilePath); 