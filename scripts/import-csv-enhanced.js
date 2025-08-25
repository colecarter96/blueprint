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
  instaEmbed: String,
  tiktokEmbed: String
});

const Video = mongoose.model('Video', videoSchema);

// Data cleaning functions
function cleanFocusField(focus) {
  if (!focus || focus.trim() === '') return null;
  
  // Convert "Music" to "Music + Culture"
  if (focus.toLowerCase() === 'music') {
    return 'Music + Culture';
  }
  
  return focus.trim();
}

function cleanMoodField(mood) {
  if (!mood || mood.trim() === '') return null;
  
  // Convert "Relaxed/Calm" to "Calm"
  if (mood.toLowerCase() === 'relaxed/calm') {
    return 'Calm';
  }
  
  return mood.trim();
}

function parseViews(viewStr) {
  if (!viewStr || viewStr.trim() === '') return 1000; // Default value
  
  const cleanStr = viewStr.toString().toUpperCase().trim();
  
  if (cleanStr.includes('K')) {
    return Math.round(parseFloat(cleanStr.replace('K', '')) * 1000);
  } else if (cleanStr.includes('M')) {
    return Math.round(parseFloat(cleanStr.replace('M', '')) * 1000000);
  } else {
    const num = parseInt(cleanStr.replace(/,/g, ''));
    return isNaN(num) ? 1000 : num;
  }
}

function parseRating(ratingStr) {
  if (!ratingStr || ratingStr.trim() === '') return Math.floor(Math.random() * 3) + 7; // Random 7-9
  
  const num = parseFloat(ratingStr);
  return isNaN(num) ? Math.floor(Math.random() * 3) + 7 : num;
}

function cleanTextField(text) {
  if (!text || text.trim() === '') return null;
  return text.trim();
}

async function enhancedImportFromCSV(csvFilePath) {
  let connection;
  
  try {
    console.log('Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const videos = [];
    const duplicateUrls = new Set();
    let skippedDuplicates = 0;
    let processedCount = 0;
    
    // Get existing videos to avoid duplicates
    console.log('Checking for existing videos...');
    const existingVideos = await Video.find({}, 'url instaEmbed tiktokEmbed').lean();
    const existingIdentifiers = new Set();
    
    existingVideos.forEach(video => {
      if (video.url && video.url.trim() !== '') {
        existingIdentifiers.add(`url:${video.url}`);
      }
      if (video.instaEmbed && video.instaEmbed.trim() !== '') {
        const embedMatch = video.instaEmbed.match(/instagram\.com\/reel\/([^\/\?]+)/);
        const id = embedMatch ? `instagram:${embedMatch[1]}` : `instagram:${video.instaEmbed.substring(0, 100)}`;
        existingIdentifiers.add(id);
      }
      if (video.tiktokEmbed && video.tiktokEmbed.trim() !== '') {
        const embedMatch = video.tiktokEmbed.match(/data-video-id="([^"]+)"/);
        const id = embedMatch ? `tiktok:${embedMatch[1]}` : `tiktok:${video.tiktokEmbed.substring(0, 100)}`;
        existingIdentifiers.add(id);
      }
    });
    
    console.log(`Found ${existingVideos.length} existing videos (${existingIdentifiers.size} unique identifiers) in database`);
    
    // Read CSV file
    const csvData = await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          processedCount++;
          
          // For Instagram/TikTok with embeds, URL is optional
          const hasInstagramEmbed = row.instaEmbed && row.instaEmbed.trim() !== '';
          const hasTikTokEmbed = row.tiktokEmbed && row.tiktokEmbed.trim() !== '';
          const hasUrl = row.url && row.url.trim() !== '';
          
          // Skip only if no URL AND no embed content
          if (!hasUrl && !hasInstagramEmbed && !hasTikTokEmbed) {
            console.log(`Row ${processedCount}: Skipping - no URL or embed content provided`);
            return;
          }
          
          // Create unique identifier based on available content
          let uniqueId;
          if (hasUrl) {
            uniqueId = `url:${row.url.trim()}`;
          } else if (hasInstagramEmbed) {
            // Use a portion of the Instagram embed as identifier
            const embedMatch = row.instaEmbed.match(/instagram\.com\/reel\/([^\/\?]+)/);
            uniqueId = embedMatch ? `instagram:${embedMatch[1]}` : `instagram:${row.instaEmbed.substring(0, 100)}`;
          } else if (hasTikTokEmbed) {
            // Use TikTok video ID as identifier
            const embedMatch = row.tiktokEmbed.match(/data-video-id="([^"]+)"/);
            uniqueId = embedMatch ? `tiktok:${embedMatch[1]}` : `tiktok:${row.tiktokEmbed.substring(0, 100)}`;
          }
          
          if (existingIdentifiers.has(uniqueId) || duplicateUrls.has(uniqueId)) {
            skippedDuplicates++;
            console.log(`Row ${processedCount}: Skipping duplicate - ${uniqueId}`);
            return;
          }
          
          duplicateUrls.add(uniqueId);
          
          // Clean and process the data
          const video = {
            platform: cleanTextField(row.platform) || 'Youtube', // Default to Youtube if missing
            title: cleanTextField(row.title) || 'Untitled', // Default title
            user: cleanTextField(row.user) || 'Unknown', // Default user
            views: parseViews(row.views),
            category: cleanTextField(row.category) || 'Lifestyle', // Default category
            focus: cleanFocusField(row.focus), // Can be null
            mood: cleanMoodField(row.mood), // Can be null
            sponsoredContent: cleanTextField(row.sponsoredContent) === 'None' ? null : cleanTextField(row.sponsoredContent),
            rating: parseRating(row.rating),
            url: hasUrl ? row.url.trim() : '', // Empty string if no URL
            instaEmbed: cleanTextField(row.instaEmbed) || '',
            tiktokEmbed: cleanTextField(row.tiktokEmbed) || ''
          };
          
          videos.push(video);
          console.log(`Row ${processedCount}: Processed - ${video.platform} by ${video.user}`);
        })
        .on('end', () => {
          resolve(videos);
        })
        .on('error', reject);
    });

    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Total rows processed: ${processedCount}`);
    console.log(`Videos to import: ${csvData.length}`);
    console.log(`Duplicates skipped: ${skippedDuplicates}`);
    console.log(`Existing in database: ${existingVideos.length}`);

    if (csvData.length === 0) {
      console.log('No new videos to import!');
      return;
    }

    // Insert videos
    console.log('\nInserting videos...');
    const result = await Video.insertMany(csvData, { ordered: false });
    console.log(`✅ Successfully imported ${result.length} videos!`);
    
    // Show summary of what was imported
    const platformCounts = {};
    const focusCounts = {};
    
    csvData.forEach(video => {
      platformCounts[video.platform] = (platformCounts[video.platform] || 0) + 1;
      if (video.focus) {
        focusCounts[video.focus] = (focusCounts[video.focus] || 0) + 1;
      }
    });
    
    console.log('\n=== IMPORT BREAKDOWN ===');
    console.log('By Platform:');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count}`);
    });
    
    console.log('\nBy Focus:');
    Object.entries(focusCounts).forEach(([focus, count]) => {
      console.log(`  ${focus}: ${count}`);
    });

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('\nMongoDB connection closed.');
    }
  }
}

// Run the import
const csvFile = process.argv[2] || 'Blueprint - Sheet1 (2).csv';
console.log(`Starting enhanced import from: ${csvFile}`);
enhancedImportFromCSV(csvFile);