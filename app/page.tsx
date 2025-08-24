"use client";

import { useEffect, useRef, useState } from "react";

// TypeScript declarations for global objects
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
    TikTok?: any;
  }
}

// Video interface matching your MongoDB structure
interface Video {
  _id: string;
  platform: "Youtube" | "TikTok" | "Instagram";
  title: string;
  user: string;
  views: number;
  category: "Cinematic/Storytelling" | "Comedy/Humor" | "Educational" | "Lifestyle" | "Trends/Viral";
  focus: "Sports" | "Fashion" | "Beauty" | "Health + Wellness" | "Tech + Gaming" | "Travel + Adventure";
  mood: "Calm" | "High Energy" | "Emotional" | "Funny/Lighthearted" | "Dramatic/Suspenseful";
  sponsoredContent: "Goods" | "Services" | "Events" | null;
  rating: number;
  url: string;
  instaEmbed: string;
}

// Filter options
const filterOptions = {
  category: ["Cinematic/Storytelling", "Comedy/Humor", "Educational", "Lifestyle", "Trends/Viral"],
  focus: ["Sports", "Fashion", "Beauty", "Health + Wellness", "Tech + Gaming", "Travel + Adventure"],
  mood: ["Calm", "High Energy", "Emotional", "Funny/Lighthearted", "Dramatic/Suspenseful"],
  sponsoredContent: ["Goods", "Services", "Events", "None"]
};

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string } | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileFilterGroup, setMobileFilterGroup] = useState<string | null>(null);

  // Load scripts when component mounts
  useEffect(() => {
    loadInstagramScript();
    loadTikTokScript();
  }, []);

  // Fetch videos from API
  useEffect(() => {
    fetchVideos();
  }, []);

  // Filter videos based on active filter
  const filteredVideos = videos.filter(video => {
    if (!activeFilter) return true;
    
    switch (activeFilter.type) {
      case 'category':
        return video.category === activeFilter.value;
      case 'focus':
        return video.focus === activeFilter.value;
      case 'mood':
        return video.mood === activeFilter.value;
      case 'sponsoredContent':
        if (activeFilter.value === 'None') {
          return video.sponsoredContent === null;
        }
        return video.sponsoredContent === activeFilter.value;
      default:
        return true;
    }
  });

  // Re-run embed scripts when videos change
  useEffect(() => {
    if (videos.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Re-execute Instagram embeds
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        
        // For TikTok, we need to reload the script to process new embeds
        const existingTikTokScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (existingTikTokScript) {
          existingTikTokScript.remove();
        }
        
        const newTikTokScript = document.createElement('script');
        newTikTokScript.src = 'https://www.tiktok.com/embed.js';
        newTikTokScript.async = true;
        document.body.appendChild(newTikTokScript);
      }, 1500); // Increased delay to ensure scripts are fully loaded

      return () => clearTimeout(timer);
    }
  }, [videos, filteredVideos]); // Added filteredVideos dependency

  // Additional effect specifically for TikTok embeds when filters change
  useEffect(() => {
    if (filteredVideos.length > 0) {
      // Check if we have TikTok videos in the filtered results
      const hasTikTokVideos = filteredVideos.some(video => video.platform === 'TikTok');
      
      if (hasTikTokVideos) {
        // Small delay to ensure DOM is ready after filter changes
        const timer = setTimeout(() => {
          // Remove existing TikTok script
          const existingTikTokScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
          if (existingTikTokScript) {
            existingTikTokScript.remove();
          }
          
          // Add new TikTok script to process filtered embeds
          const newTikTokScript = document.createElement('script');
          newTikTokScript.src = 'https://www.tiktok.com/embed.js';
          newTikTokScript.async = true;
          document.body.appendChild(newTikTokScript);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [filteredVideos]); // Only run when filtered videos change

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter selection
  const handleFilterSelect = (type: string, value: string) => {
    if (activeFilter?.type === type && activeFilter?.value === value) {
      // If same filter is clicked again, remove it
      setActiveFilter(null);
    } else {
      // Set new filter
      setActiveFilter({ type, value });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilter(null);
  };

  // Load Instagram embed script
  const loadInstagramScript = () => {
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const script = document.createElement('script');
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

  // Load TikTok embed script
  const loadTikTokScript = () => {
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Render video based on platform
  const renderVideo = (video: Video) => {
    if (video.platform === "Youtube") {
      const videoId = getYouTubeVideoId(video.url);
      if (!videoId) return <div>Invalid YouTube URL</div>;
      
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      );
    } else if (video.platform === "TikTok") {
      // Extract TikTok video ID from URL
      const tiktokMatch = video.url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/);
      const videoId = tiktokMatch ? tiktokMatch[1] : null;
      
      if (!videoId) return <div>Invalid TikTok URL</div>;
      
      return (
        <div className="w-full" style={{ aspectRatio: '9/16' }}>
          <div
            className="tiktok-embed"
            style={{ 
              maxWidth: '100%', 
              minWidth: '100%',
              backgroundColor: '#1a1a1a'
            }}
            dangerouslySetInnerHTML={{
              __html: `<blockquote class="tiktok-embed" cite="${video.url}" data-video-id="${videoId}" style="max-width: 100%; min-width: 100%; background-color: #1a1a1a;">
                <section> 
                  <a target="_blank" title="@${video.user}" href="${video.url}">@${video.user}</a> 
                  <p></p>
                  <a target="_blank" title="♬ Original Sound" href="${video.url}">♬ Original Sound</a>
                </section> 
              </blockquote>`
            }}
          />
        </div>
      );
    } else if (video.platform === "Instagram") {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: video.instaEmbed
          }}
        />
      );
    }
    return <div>Unsupported platform</div>;
  };

  // Get user info for display
  const getUserInfo = (video: Video) => {
    return video.user.startsWith('@') ? video.user : `@${video.user}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white">
        <header className="p-6">
          <h1 className="text-3xl font-bold">blueprint</h1>
        </header>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl">Loading videos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white">
        <header className="p-6">
          <h1 className="text-3xl font-bold">blueprint</h1>
        </header>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-3xl font-bold">blueprint</h1>
      </header>

      {/* Filters Section */}
      <div className="px-6 pb-6">
        {/* Desktop Filters - Large screens */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-6">
            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Categories</h3>
              <div className="space-y-2">
                {filterOptions.category.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleFilterSelect('category', category)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeFilter?.type === 'category' && activeFilter?.value === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Focus</h3>
              <div className="space-y-2">
                {filterOptions.focus.map((focus) => (
                  <button
                    key={focus}
                    onClick={() => handleFilterSelect('focus', focus)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeFilter?.type === 'focus' && activeFilter?.value === focus
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Mood</h3>
              <div className="space-y-2">
                {filterOptions.mood.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleFilterSelect('mood', mood)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeFilter?.type === 'mood' && activeFilter?.value === mood
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Sponsored Content */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Sponsored Content</h3>
              <div className="space-y-2">
                {filterOptions.sponsoredContent.map((sponsored) => (
                  <button
                    key={sponsored}
                    onClick={() => handleFilterSelect('sponsoredContent', sponsored)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeFilter?.type === 'sponsoredContent' && activeFilter?.value === sponsored
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
                    }`}
                  >
                    {sponsored}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters - Medium and small screens */}
        <div className="lg:hidden">
          <div className="relative">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-left flex items-center justify-between"
            >
              <span className="text-gray-300">
                {activeFilter ? `${activeFilter.type}: ${activeFilter.value}` : 'Select Filter'}
              </span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${mobileFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileFilterOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-lg z-10">
                {!mobileFilterGroup ? (
                  // First layer - Filter groups
                  <div className="p-2">
                    {Object.entries(filterOptions).map(([group, options]) => (
                      <button
                        key={group}
                        onClick={() => setMobileFilterGroup(group)}
                        className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#333] transition-colors"
                      >
                        {group.charAt(0).toUpperCase() + group.slice(1)} ({options.length})
                      </button>
                    ))}
                  </div>
                ) : (
                  // Second layer - Filter options
                  <div className="p-2">
                    <button
                      onClick={() => setMobileFilterGroup(null)}
                      className="block w-full text-left px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-[#333] transition-colors mb-2"
                    >
                      ← Back to groups
                    </button>
                    {filterOptions[mobileFilterGroup as keyof typeof filterOptions].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          handleFilterSelect(mobileFilterGroup, option);
                          setMobileFilterOpen(false);
                          setMobileFilterGroup(null);
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeFilter?.type === mobileFilterGroup && activeFilter?.value === option
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-[#333]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Display and Clear Button */}
        {activeFilter && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-400">Active filter:</span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              {activeFilter.type}: {activeFilter.value}
            </span>
            <button
              onClick={clearFilters}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredVideos.length} of {videos.length} videos
        </div>
      </div>

      {/* Videos Grid */}
      <div className="px-6">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredVideos.map((video) => (
            <div key={video._id} className="break-inside-avoid bg-[#1a1a1a] rounded-lg overflow-hidden shadow-lg border border-[#333]">
              {/* Video Embed */}
              <div className="w-full">
                {renderVideo(video)}
              </div>
              
              {/* Video Info */}
              <div className="p-4">
                {/* Platform and User */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      video.platform === 'Youtube' ? 'bg-red-600' :
                      video.platform === 'TikTok' ? 'bg-black' :
                      'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      {video.platform}
                    </span>
                    <span className="text-white font-medium">{getUserInfo(video)}</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {video.views.toLocaleString()} views
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white font-medium mb-3 line-clamp-2">{video.title}</h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-[#333] text-gray-300 px-2 py-1 rounded text-xs">
                    {video.category}
                  </span>
                  <span className="bg-[#333] text-gray-300 px-2 py-1 rounded text-xs">
                    {video.focus}
                  </span>
                  <span className="bg-[#333] text-gray-300 px-2 py-1 rounded text-xs">
                    {video.mood}
                  </span>
                  {video.sponsoredContent && (
                    <span className="bg-yellow-600 text-black px-2 py-1 rounded text-xs font-medium">
                      {video.sponsoredContent}
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(video.rating / 2) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">{video.rating}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
