# Blueprint - Video Curation App

A Next.js web application that curates video content for inspiration, similar to Mobbin but for social media videos. The app supports YouTube, TikTok, and Instagram videos with efficient, scalable embedding.

## Features

- **Multi-platform Support**: YouTube, TikTok, and Instagram video embedding
- **Responsive Design**: Customizable video dimensions
- **Efficient Storage**: MongoDB-based data structure optimized for video metadata
- **TypeScript**: Full type safety with comprehensive interfaces

## Architecture

### Data Storage Strategy

**YouTube**: Store `videoId` or full URL, generate iframe dynamically
**TikTok**: Store full video URL, generate embed using TikTok embed structure
**Instagram**: Store full embed HTML to avoid API limits and rate restrictions

### MongoDB Document Structure

```typescript
interface VideoData {
  _id: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  tags: string[];
  orientation: 'horizontal' | 'vertical';
  url: string;
  embedHtml?: string; // Only for Instagram
  dateAdded: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  viewCount?: number;
}
```

## Components

### EmbedPlayer

A reusable component that renders videos from all three platforms appropriately.

#### Props

```typescript
interface EmbedPlayerProps {
  video: VideoData;           // Required: Video data object
  width?: number;             // Optional: Video width (default: 560)
  height?: number;            // Optional: Video height (default: 315)
  className?: string;         // Optional: Additional CSS classes
  onLoad?: () => void;       // Optional: Callback when video loads
  onError?: (error: string) => void; // Optional: Error callback
}
```

#### Usage

```tsx
import EmbedPlayer, { VideoData } from './components/EmbedPlayer';

const video: VideoData = {
  _id: "1",
  platform: "youtube",
  tags: ["cinematic", "sports"],
  orientation: "horizontal",
  url: "https://www.youtube.com/watch?v=fVlVZTHmkaw",
  dateAdded: "2024-01-15T10:00:00Z",
  title: "Amazing Sports Moment"
};

<EmbedPlayer 
  video={video}
  width={560}
  height={315}
  onLoad={() => console.log('Video loaded!')}
  onError={(error) => console.error(error)}
/>
```

## Platform-Specific Requirements

### YouTube
- **Stored Data**: `videoId` or full URL
- **Embed Type**: `<iframe>` with YouTube embed URL
- **Script Required**: None (works immediately)
- **URL Format**: `https://www.youtube.com/embed/{VIDEO_ID}`

### TikTok
- **Stored Data**: Full video URL
- **Embed Type**: `<blockquote>` with TikTok embed structure
- **Script Required**: `https://www.tiktok.com/embed.js`
- **URL Format**: `https://www.tiktok.com/@username/video/{VIDEO_ID}`

### Instagram
- **Stored Data**: Full embed HTML (including `<blockquote>` and script)
- **Embed Type**: Raw HTML via `dangerouslySetInnerHTML`
- **Script Required**: `//www.instagram.com/embed.js`
- **Implementation**: Must preserve exact HTML structure

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **View the demo**:
   - Navigate to `/components/EmbedPlayerDemo` to see the component in action
   - Test different video types and customize dimensions

## Demo

The `EmbedPlayerDemo` component showcases:
- Platform switching between YouTube, TikTok, and Instagram
- Customizable video dimensions
- Video information display
- Usage examples with code snippets

## Technical Notes

- **Client-side Rendering**: Component uses `"use client"` directive for browser APIs
- **Script Management**: Dynamically loads platform-specific embed scripts
- **Error Handling**: Comprehensive error handling for invalid URLs and script failures
- **Performance**: Scripts are loaded only once per platform and reused
- **Responsive**: Supports custom dimensions while maintaining platform-specific constraints

## Future Enhancements

- **Lazy Loading**: Implement lazy loading for better performance
- **Analytics**: Track video engagement and loading metrics
- **Caching**: Implement embed script caching strategies
- **Fallbacks**: Add fallback content for failed embeds
- **Accessibility**: Enhance keyboard navigation and screen reader support
