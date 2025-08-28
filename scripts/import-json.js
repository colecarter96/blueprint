const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Connect to MongoDB
//run with this:
//node -r dotenv/config import-json.js "./scraped_content (9).json" dotenv_config_path=../.env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in your .env file');
  process.exit(1);
}

// Minimal Video schema for scripting context (avoids TS/ESM imports here)
const videoSchema = new mongoose.Schema({
  platform: String,
  title: String,
  user: String,
  views: Number,
  likes: Number,
  category: String,
  focus: String,
  mood: String,
  sponsoredContent: String,
  rating: Number,
  url: String,
  instaEmbed: String,
  tiktokEmbed: String,
}, { timestamps: false, versionKey: false });

// Use the 'videos' collection explicitly
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema, 'videos');

function parseNumber(input, fallback = undefined) {
  if (input === undefined || input === null || input === '') return fallback;
  const str = input.toString().trim().toUpperCase();
  if (str.endsWith('K')) return Math.round(parseFloat(str) * 1_000);
  if (str.endsWith('M')) return Math.round(parseFloat(str) * 1_000_000);
  const n = Number(str);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeMood(mood) {
  if (!mood) return 'Calm';
  const m = mood.trim();
  if (m === 'Relaxed/Calm') return 'Calm';
  const allowed = ['Calm', 'High Energy', 'Emotional', 'Funny/Lighthearted', 'Dramatic/Suspenseful'];
  return allowed.includes(m) ? m : 'Calm';
}

function normalizeFocus(focus) {
  if (!focus) return 'Tech + Gaming';
  let f = focus.trim();
  if (f === 'Music') f = 'Music + Culture';
  const allowed = ['Sports', 'Fashion', 'Beauty', 'Health + Wellness', 'Tech + Gaming', 'Travel + Adventure', 'Music + Culture', 'Finance'];
  return allowed.includes(f) ? f : 'Tech + Gaming';
}

async function importFromJson(jsonPath) {
  let connection;
  try {
    console.log('Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    if (!fs.existsSync(jsonPath)) {
      console.error(`File not found: ${jsonPath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    const items = Array.isArray(data) ? data : [data];

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of items) {
      try {
        const platform = row.platform?.toString().trim();
        const platformLower = platform ? platform.toLowerCase() : '';
        const normalizedPlatform = platformLower === 'youtube' ? 'Youtube' : platformLower === 'tiktok' ? 'TikTok' : platformLower === 'instagram' ? 'Instagram' : platform;
        const isInstagram = platform === 'Instagram';
        const isTikTok = platform === 'TikTok';

        // Build document with flexible/optional fields
        const rawTitle = row.title?.toString().trim();
        const rawUser = row.user?.toString().trim();
        // Support alias: instagramEmbed -> instaEmbed
        const rawInstaEmbed = (row.instaEmbed ?? row.instagramEmbed)?.toString();
        const rawTikTokEmbed = row.tiktokEmbed?.toString();

        const doc = {
          platform: normalizedPlatform,
          title: rawTitle || '',
          user: rawUser,
          views: parseNumber(row.views, 0) ?? 0,
          likes: parseNumber(row.likes, undefined),
          category: row.category?.trim() || 'Lifestyle',
          focus: normalizeFocus(row.focus),
          mood: normalizeMood(row.mood),
          sponsoredContent: row.sponsoredContent?.trim() || null,
          rating: parseNumber(row.rating, undefined),
          url: row.url?.trim() || '',
          instaEmbed: rawInstaEmbed || '',
          tiktokEmbed: rawTikTokEmbed || '',
        };

        // Validation per platform (strict per your rules)
        const hasBase = Boolean(platform && doc.user);
        const hasInstaRequirement = isInstagram ? Boolean(doc.instaEmbed) : true;
        const hasTikTokRequirement = isTikTok ? Boolean(doc.tiktokEmbed) : true;
        const hasYouTubeRequirement = platform === 'Youtube' ? Boolean(row.url) : true;

        if (!(hasBase && hasInstaRequirement && hasTikTokRequirement && hasYouTubeRequirement)) {
          console.warn('⚠️  Skipping - missing required fields', {
            platform,
            user: doc.user,
            url: doc.url,
            instaEmbed: isInstagram ? !!doc.instaEmbed : undefined,
            tiktokEmbed: isTikTok ? !!doc.tiktokEmbed : undefined,
            youtubeTitle: platform === 'Youtube' ? !!rawTitle : undefined,
          });
          skipped++;
          continue;
        }

        // Deduplication key priority: TikTok by tiktokEmbed or URL; Instagram by instaEmbed or URL; others by URL
        let matchQuery = {};
        if (isTikTok && doc.tiktokEmbed) matchQuery = { tiktokEmbed: doc.tiktokEmbed };
        else if (isInstagram && doc.instaEmbed) matchQuery = { instaEmbed: doc.instaEmbed };
        else if (doc.url) matchQuery = { url: doc.url };

        const existing = Object.keys(matchQuery).length ? await Video.findOne(matchQuery) : null;
        if (existing) {
          await Video.updateOne(matchQuery, { $set: { ...doc } });
          updated++;
          console.log(`🔄 Updated: ${doc.title}`);
        } else {
          await Video.create(doc);
          added++;
          console.log(`✅ Added: ${doc.title}`);
        }
      } catch (e) {
        skipped++;
        console.error('❌ Error processing item:', e.message);
      }
    }

    console.log('\n📊 JSON Import Summary:');
    console.log(`  ✅ Added: ${added}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ❌ Skipped: ${skipped}`);
    console.log(`  📝 Total: ${items.length}`);
  } catch (error) {
    console.error('Error importing from JSON:', error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    }
  }
}

// CLI
const jsonPath = process.argv[2];
if (!jsonPath) {
  console.log(`
Usage: node scripts/import-json.js <path-to-json-file>

JSON can be an object or array of objects. Only necessary fields per platform are required.
Recognized fields:
- platform (Youtube | TikTok | Instagram)
- title
- user
- url (required for Youtube; optional for Instagram/TikTok if embed present)
- instaEmbed (Instagram)
- tiktokEmbed (TikTok)
- views (number or "12K"/"3.4M")
- likes (number or "12K"/"3.4M")
- category, focus, mood, sponsoredContent, rating

Examples:
[
  {"platform":"TikTok","title":"Clip","user":"@abc","tiktokEmbed":"<blockquote ...>","likes":"12K","category":"Trends/Viral","focus":"Fashion","mood":"High Energy"},
  {"platform":"Instagram","user":"brand","instaEmbed":"<blockquote ...>","likes":3456}
]
  `);
  process.exit(1);
}

importFromJson(jsonPath);

