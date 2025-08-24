const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in your .env file');
  process.exit(1);
}

// Video schema (simplified for adding)
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

async function addVideo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Get video details from command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
      console.log(`
Usage: node scripts/add-video.js <platform> <title> <user> <url> [views] [rating]

Example: node scripts/add-video.js "Youtube" "Amazing Video" "ChannelName" "https://youtube.com/watch?v=123" 1000000 8

Platforms: Youtube, TikTok, Instagram
Categories: Cinematic/Storytelling, Comedy/Humor, Educational, Lifestyle, Trends/Viral
Focus: Sports, Fashion, Beauty, Health + Wellness, Tech + Gaming, Travel + Adventure
Mood: Calm, High Energy, Emotional, Funny/Lighthearted, Dramatic/Suspenseful
Sponsored: Goods, Services, Events, or leave empty
      `);
      process.exit(1);
    }

    const [platform, title, user, url, views = 1000, rating = 7] = args;

    // Default values for other fields
    const video = new Video({
      platform,
      title,
      user,
      views: parseInt(views),
      category: "Lifestyle", // Default
      focus: "Tech + Gaming", // Default
      mood: "Calm", // Default
      sponsoredContent: null, // Default
      rating: parseInt(rating),
      url,
      instaEmbed: platform === "Instagram" ? "Add embed HTML here" : ""
    });

    await video.save();
    console.log(`✅ Video added successfully: ${title} by ${user}`);
    console.log(`Platform: ${platform}`);
    console.log(`URL: ${url}`);

  } catch (error) {
    console.error('Error adding video:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Run the function
addVideo(); 