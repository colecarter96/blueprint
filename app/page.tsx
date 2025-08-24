"use client";

import { useEffect, useState } from "react";

// TypeScript declarations for global objects
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
    TikTok?: unknown;
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
  tiktokEmbed: string;
}

// Filter options
const filterOptions = {
  category: ["Cinematic/Storytelling", "Comedy/Humor", "Educational", "Lifestyle", "Trends/Viral"],
  focus: ["Sports", "Fashion", "Beauty", "Health + Wellness", "Tech + Gaming", "Travel + Adventure"],
  mood: ["Calm", "High Energy", "Emotional", "Funny/Lighthearted", "Dramatic/Suspenseful"],
  sponsoredContent: ["Goods", "Services", "Events", "None"]
};

// TikTok Video Component - Simplified and Reliable
function TikTokVideo({ video }: { video: Video }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [video._id]);

  // If we have full embed HTML, use it; otherwise show fallback
  if (!video.tiktokEmbed || video.tiktokEmbed.trim() === '') {
    return (
      <div className="w-full bg-[#1a1a1a] flex items-center justify-center text-center" style={{ 
        aspectRatio: '299/659', 
        maxHeight: '1151px',
        height: 'clamp(620px, 70.8vh, 974px)'
      }}>
        <div>
          <p className="text-lg font-medium text-yellow-400 mb-2">TikTok embed not available</p>
          <p className="text-sm text-gray-400 mb-3">@{video.user}</p>
          <a 
            href={video.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View on TikTok
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ 
      aspectRatio: '299/659', 
      maxHeight: '1151px',
      height: 'clamp(620px, 70.8vh, 974px)'
    }}>
      {/* Loading State */}
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-lg font-medium">Loading TikTok...</p>
            <p className="text-sm text-gray-400 mt-1">@{video.user}</p>
          </div>
        </div>
      )}
      
      {/* TikTok Embed - Use full embed HTML */}
      <div
        className={`w-full h-full ${isLoading ? 'hidden' : ''}`}
        style={{ backgroundColor: '#1a1a1a' }}
        dangerouslySetInnerHTML={{
          __html: video.tiktokEmbed
        }}
      />
    </div>
  );
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string } | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileFilterGroup, setMobileFilterGroup] = useState<string | null>(null);

  // Add fallback state for failed embeds
  const [embedFailures, setEmbedFailures] = useState<Set<string>>(new Set());

  // Function to mark embed as failed
  const markEmbedFailed = (videoId: string) => {
    setEmbedFailures(prev => new Set(prev).add(videoId));
  };

  // Function to retry embed
  const retryEmbed = (videoId: string) => {
    setEmbedFailures(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
    // Force reload of scripts
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        // Reload TikTok script
        const existingScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (existingScript) {
          existingScript.remove();
        }
        loadTikTokScript();
      }, 1000);
    }
  };

  // Simplified script loading
  const loadEmbedScripts = () => {
    if (typeof window === 'undefined') return;

    // Load Instagram script
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const instagramScript = document.createElement('script');
      instagramScript.src = '//www.instagram.com/embed.js';
      instagramScript.async = true;
      document.body.appendChild(instagramScript);
    }

    // Load TikTok script
    if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const tiktokScript = document.createElement('script');
      tiktokScript.src = 'https://www.tiktok.com/embed.js';
      tiktokScript.async = true;
      document.body.appendChild(tiktokScript);
    }
  };

  // Load scripts once when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmbedScripts();
    }, 500);

    return () => clearTimeout(timer);
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

  // Process embeds when videos change
  useEffect(() => {
    if (videos.length > 0 && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        // Re-process Instagram embeds
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        
        // For TikTok, reload the script to process new embeds
        const existingScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (existingScript) {
          existingScript.remove();
        }
        
        const newScript = document.createElement('script');
        newScript.src = 'https://www.tiktok.com/embed.js';
        newScript.async = true;
        document.body.appendChild(newScript);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [videos, filteredVideos]);

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

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Render video based on platform
  const renderVideo = (video: Video) => {
    const videoId = video._id;
    const hasFailed = embedFailures.has(videoId);
    
    if (video.platform === "Youtube") {
      const youtubeId = getYouTubeVideoId(video.url);
      if (!youtubeId) return <div>Invalid YouTube URL</div>;
      
      if (hasFailed) {
        return (
          <div className="w-full h-[315px] bg-[#1a1a1a] flex items-center justify-center text-center">
            <div>
              <p className="text-lg font-medium text-red-400 mb-2">YouTube embed failed to load</p>
              <p className="text-sm text-gray-400 mb-3">@{video.user}</p>
              <button 
                onClick={() => retryEmbed(videoId)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onError={() => markEmbedFailed(videoId)}
        />
      );
    } else if (video.platform === "TikTok") {
      if (hasFailed) {
        return (
          <div className="w-full bg-[#1a1a1a] flex items-center justify-center text-center" style={{ 
            aspectRatio: '299/659', 
            maxHeight: '1151px',
            height: 'clamp(620px, 70.8vh, 974px)'
          }}>
            <div>
              <p className="text-lg font-medium text-red-400 mb-2">TikTok embed failed to load</p>
              <p className="text-sm text-gray-400 mb-3">@{video.user}</p>
              <button 
                onClick={() => retryEmbed(videoId)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        );
      }
      
      return <TikTokVideo key={video._id} video={video} />;
    } else if (video.platform === "Instagram") {
      if (hasFailed) {
        return (
          <div className="w-full bg-[#1a1a1a] flex items-center justify-center text-center" style={{ 
            aspectRatio: '1/1', 
            maxHeight: '600px'
          }}>
            <div>
              <p className="text-lg font-medium text-red-400 mb-2">Instagram embed failed to load</p>
              <p className="text-sm text-gray-400 mb-3">@{video.user}</p>
              <button 
                onClick={() => retryEmbed(videoId)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: video.instaEmbed
          }}
          onError={() => markEmbedFailed(videoId)}
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

      {/* Filters */}
      <div className="mb-8">
        {/* Desktop Filters */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-8 justify-items-center">
            {/* Categories */}
            <div className="text-center">
              <h3 className="text-base text-gray-400 mb-2 font-bold text-left">Categories</h3>
              <div className="space-y-2">
                {filterOptions.category.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleFilterSelect('category', category)}
                    className={`block w-full text-left text-3xl font-bold transition-colors ${
                      activeFilter?.type === 'category' && activeFilter?.value === category
                        ? 'text-blue-400'
                        : 'text-white hover:text-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus */}
            <div className="text-center">
              <h3 className="text-base text-gray-400 mb-2 font-bold text-left">Focus</h3>
              <div className="space-y-2">
                {filterOptions.focus.map((focus) => (
                  <button
                    key={focus}
                    onClick={() => handleFilterSelect('focus', focus)}
                    className={`block w-full text-left text-3xl font-bold transition-colors ${
                      activeFilter?.type === 'focus' && activeFilter?.value === focus
                        ? 'text-blue-400'
                        : 'text-white hover:text-gray-300'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div className="text-center">
              <h3 className="text-base text-gray-400 mb-2 font-bold text-left">Mood</h3>
              <div className="space-y-2">
                {filterOptions.mood.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleFilterSelect('mood', mood)}
                    className={`block w-full text-left text-3xl font-bold transition-colors ${
                      activeFilter?.type === 'mood' && activeFilter?.value === mood
                        ? 'text-blue-400'
                        : 'text-white hover:text-gray-300'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Sponsored Content */}
            <div className="text-center">
              <h3 className="text-base text-gray-400 mb-2 font-bold text-left">Sponsored Content</h3>
              <div className="space-y-2">
                {filterOptions.sponsoredContent.map((content) => (
                  <button
                    key={content}
                    onClick={() => handleFilterSelect('sponsoredContent', content)}
                    className={`block w-full text-left text-3xl font-bold transition-colors ${
                      activeFilter?.type === 'sponsoredContent' && activeFilter?.value === content
                        ? 'text-blue-400'
                        : 'text-white hover:text-gray-300'
                    }`}
                  >
                    {content}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="lg:hidden">
          <div className="space-y-2">
            {Object.entries(filterOptions).map(([filterType, options]) => (
              <div key={filterType} className="border border-gray-600 rounded-lg">
                <button
                  onClick={() => setMobileFilterGroup(mobileFilterGroup === filterType ? null : filterType)}
                  className="flex items-center justify-between w-full p-3 text-left"
                >
                  <span className="text-sm text-gray-400 font-bold capitalize">
                    {filterType === 'sponsoredContent' ? 'Sponsored Content' : filterType}
                  </span>
                  <span className="text-gray-400">
                    {mobileFilterGroup === filterType ? '−' : '+'}
                  </span>
                </button>
                
                {mobileFilterGroup === filterType && (
                  <div className="pl-4 space-y-2 pb-3">
                    {options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleFilterSelect(filterType as keyof typeof filterOptions, option)}
                        className={`block w-full text-left text-base font-bold transition-colors ${
                          activeFilter?.type === filterType && activeFilter?.value === option
                            ? 'text-blue-400'
                            : 'text-white hover:text-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Info - Below Filters, Above Videos, Far Right */}
      <div className="flex justify-end mb-6">
        {activeFilter && (
          <div className="text-right">
            <div className="text-white text-sm mb-2">
              Showing {filteredVideos.length} of {videos.length} videos
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-gray-400 text-sm">
                Filtered by {activeFilter.type}: {activeFilter.value}
              </span>
              <button
                onClick={clearFilters}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}
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
              
              {/* Video Info - Always render for all video types */}
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
