# 📊 CSV Import Guide for Video Database

## 🚀 **Why This Approach is Perfect:**

- **Easy to use**: Fill out a spreadsheet like a form
- **Batch upload**: Add 50+ videos at once  
- **Collaborative**: Share with team members
- **Visual**: See all your data organized
- **Exportable**: Easy to backup and modify

## 📋 **Step-by-Step Workflow:**

### **1. Create Google Sheet**
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Copy the headers from `videos-template.csv`:
   ```
   platform,title,user,views,category,focus,mood,sponsoredContent,rating,url,instaEmbed
   ```

### **2. Fill Out Your Data**
Use these exact values for the fields:

#### **Platform Options:**
- `Youtube`
- `TikTok` 
- `Instagram`

#### **Category Options:**
- `Cinematic/Storytelling`
- `Comedy/Humor`
- `Educational`
- `Lifestyle`
- `Trends/Viral`

#### **Focus Options:**
- `Sports`
- `Fashion`
- `Beauty`
- `Health + Wellness`
- `Tech + Gaming`
- `Travel + Adventure`

#### **Mood Options:**
- `Calm`
- `High Energy`
- `Emotional`
- `Funny/Lighthearted`
- `Dramatic/Suspenseful`

#### **Sponsored Content Options:**
- `Goods`
- `Services`
- `Events`
- Leave empty for non-sponsored

### **3. Get Instagram Embed HTML**
For Instagram videos, you need the embed HTML:
1. Go to the Instagram post
2. Click the 3 dots → "Embed"
3. Copy the entire HTML code
4. Paste it in the `instaEmbed` column

### **4. Export as CSV**
1. In Google Sheets: File → Download → CSV
2. Save the file (e.g., `my-videos.csv`)
3. Place it in your project folder

### **5. Import to Database**
```bash
node scripts/import-csv.js my-videos.csv
```

## 📝 **Example Row:**
```
Youtube,Amazing Sports Moment,SportsCentral,1500000,Cinematic/Storytelling,Sports,High Energy,,9,https://youtube.com/watch?v=VIDEO_ID,
```

## ⚠️ **Important Notes:**

- **Required fields**: `platform`, `title`, `user`, `url`
- **Optional fields**: `views`, `category`, `focus`, `mood`, `sponsoredContent`, `rating`, `instaEmbed`
- **Default values**: If you leave optional fields empty, they'll use sensible defaults
- **Instagram**: Only Instagram videos need the `instaEmbed` field filled

## 🔄 **Update Existing Data:**

1. Export current data: `node scripts/export-csv.js` (if you want this feature)
2. Edit in Google Sheets
3. Re-import: `node scripts/import-csv.js updated-videos.csv`

## 🎯 **Pro Tips:**

- Use Google Sheets formulas for repetitive data
- Create dropdown lists for consistent categorization
- Use conditional formatting to highlight missing required fields
- Share the sheet with your team for collaborative curation

This workflow makes it super easy to manage hundreds of videos! 🎉 