"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

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
  focus: "Sports" | "Fashion" | "Beauty" | "Health + Wellness" | "Tech + Gaming" | "Travel + Adventure" | "Music + Culture" | "Finance";
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
  focus: ["Sports", "Fashion", "Beauty", "Health + Wellness", "Tech + Gaming", "Travel + Adventure", "Music + Culture", "Finance"],
  mood: ["Calm", "High Energy", "Emotional", "Funny/Lighthearted", "Dramatic/Suspenseful"],
  sponsoredContent: ["Goods", "Services", "Events", "None"]
};

// TikTok Video Component - Simplified and Reliable
function TikTokVideo({ video }: { video: Video }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Shorter loading timeout for initial page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

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
  const [activeFilters, setActiveFilters] = useState<{ type: string; value: string }[]>([]);
  // Search state (persisted)
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isMdUp, setIsMdUp] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileFilterGroup, setMobileFilterGroup] = useState<string | null>(null);
  const [orientationFilter, setOrientationFilter] = useState<"all" | "vertical" | "horizontal">("all");
  const [globalLoading, setGlobalLoading] = useState(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState(25);

  // Load persisted search on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bp:search");
      if (saved) {
        setSearchInput(saved);
        setSearchQuery(saved);
      }
    } catch {}
  }, []);

  // Persist search query
  useEffect(() => {
    try {
      if (searchQuery) {
        localStorage.setItem("bp:search", searchQuery);
      } else {
        localStorage.removeItem("bp:search");
      }
    } catch {}
  }, [searchQuery]);

  // Responsive flag for single SearchBar rendering
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMdUp(media.matches);
    update();
    try {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    } catch {
      // Safari fallback
      media.addListener(update);
      return () => media.removeListener(update);
    }
  }, []);

  // Refocus input while typing to prevent unintended blur (removed to avoid conflicts)
  // useEffect(() => {
  //   if (searchInputRef.current) {
  //     const isActive = document.activeElement === searchInputRef.current;
  //     if (!isActive && searchInput.length > 0) {
  //       searchInputRef.current.focus();
  //     }
  //   }
  // }, [searchInput]);

  // Lightweight synonym map for semantic matching (stable reference)
  const synonymMap = useMemo<Record<string, string[]>>(
    () => ({
      ocean: ["sea", "beach", "waves", "surf", "coast"],
      surf: ["ocean", "waves", "beach"],
      cinema: ["cinematic", "movie", "film"],
      movie: ["cinematic", "film", "cinema"],
      relaxing: ["calm", "chill"],
      energetic: ["high energy", "hype", "intense"],
      tech: ["technology", "gaming", "tech + gaming"],
      music: ["music + culture", "song", "artist"],
      finance: ["money", "investing"],
      sports: ["athletics", "competition"],
      funny: ["comedy", "humor"],
    }),
    []
  );

  const tokenizeQuery = useCallback((q: string): string[] => {
    const base = q
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    const expanded: Set<string> = new Set(base);
    for (const word of base) {
      const syns = synonymMap[word];
      if (syns) {
        syns.forEach((s) => expanded.add(s));
      }
    }
    return Array.from(expanded);
  }, [synonymMap]);

  // Score a single video against tokens
  const scoreVideo = (video: Video, tokens: string[]): number => {
    let score = 0;
    const title = video.title?.toLowerCase() || "";
    const user = (video.user?.toLowerCase() || "").replace(/^@/, "");
    const category = video.category?.toLowerCase() || "";
    const focus = video.focus?.toLowerCase() || "";
    const mood = video.mood?.toLowerCase() || "";
    const platform = video.platform?.toLowerCase() || "";

    for (const t of tokens) {
      if (title.includes(t)) score += 5;
      if (user.includes(t)) score += 4;
      if (category.includes(t)) score += 3;
      if (focus.includes(t)) score += 3;
      if (mood.includes(t)) score += 2;
      if (platform.includes(t)) score += 1;
    }
    return score;
  };

  // Animated logo component for loading
  const AnimatedLogo = () => (
    <svg
      width="120"
      height="140"
      viewBox="0 0 86.583084 101.56311"
      className="animate-pulse"
    >
      <g transform="translate(-1755.7751,-901.69998)">
        <path
          d="m 1762.2405,996.79764 h 45.8141 c 16.2284,0 27.838,-9.73705 27.838,-25.3413 0,-10.36122 -6.7411,-18.22576 -16.7278,-21.34661 8.1142,-2.87119 12.3586,-9.11289 12.3586,-18.3506 0,-13.73174 -10.7358,-23.59363 -26.8393,-23.59363 h -42.4436 z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="12.931"
          strokeDasharray="400"
          strokeDashoffset="400"
          style={{
            animation: 'draw 3s ease-in-out infinite'
          }}
        />
      </g>
      <style jsx>{`
        @keyframes draw {
          0% {
            stroke-dashoffset: 400;
            opacity: 0.3;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -400;
            opacity: 0.3;
          }
        }
      `}</style>
    </svg>
  );

  // Global loading animation component with animated logo
  const GlobalLoadingOverlay = () => (
    <div className="absolute inset-0 bg-[#2a2a2a] z-50 flex items-start justify-center pt-20">
      <div className="text-center">
        <AnimatedLogo />
      </div>
    </div>
  );

  // Combined filter pills and info component
  const FilterPillsAndInfo = () => {
    return (
      <div className="mb-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 sm:items-center sm:justify-between">
          {/* Left side - Filter pills and info */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
            {/* Search pill */}
            {searchQuery && (
              <div className="flex items-center bg-transparent text-white px-2 sm:px-3 py-1 rounded-full text-sm sm:text-base font-bold border-2 border-white">
                <span className="mr-1 sm:mr-2">{searchQuery}</span>
                <button
                  onClick={() => { setSearchQuery(""); setSearchInput(""); }}
                  className="text-gray-300 hover:text-white transition-colors font-bold text-sm sm:text-base"
                  aria-label={`Clear search`}
                >
                  ×
                </button>
              </div>
            )}

            {activeFilters.length > 0 && (
              <>
                {/* Active filters label and pills row */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-gray-400 text-sm sm:text-base font-medium">Active filters:</span>
                  {activeFilters.map((filter, index) => (
                    <div
                      key={`${filter.type}-${filter.value}-${index}`}
                      className="flex items-center bg-transparent text-white px-2 sm:px-3 py-1 rounded-full text-sm sm:text-base font-bold border-2 border-white"
                    >
                      <span className="mr-1 sm:mr-2">{filter.value}</span>
                      <button
                        onClick={() => removeFilter(filter.type, filter.value)}
                        className="text-gray-300 hover:text-white transition-colors font-bold text-sm sm:text-base"
                        aria-label={`Remove ${filter.value} filter`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Filter count and video count row */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-gray-400 text-sm sm:text-base font-medium">
                    {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} applied
                  </span>
                  <span className="text-white text-sm sm:text-base font-bold">
                    Showing {filteredVideos.length} of {videos.length} videos
                  </span>
                </div>
              </>
            )}

            {/* Video count when no filters */}
            {activeFilters.length === 0 && !searchQuery && (
              <span className="text-white text-sm sm:text-base font-bold">
                Showing {filteredVideos.length} of {videos.length} videos
              </span>
            )}
          </div>

          {/* Right side - Clear button */}
          {(activeFilters.length > 0 || searchQuery) && (
            <button
              onClick={() => { setActiveFilters([]); setSearchQuery(""); setSearchInput(""); }}
              className="bg-transparent text-white px-2 sm:px-3 py-1 rounded-full text-sm sm:text-base font-bold border-2 border-white hover:bg-white hover:text-black transition-colors self-start sm:self-auto"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    );
  };

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
        // Create new TikTok script
        const newScript = document.createElement('script');
        newScript.src = 'https://www.tiktok.com/embed.js';
        newScript.async = true;
        document.body.appendChild(newScript);
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

  // Load scripts when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmbedScripts();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Additional script loading after videos are loaded (for initial page load)
  useEffect(() => {
    if (videos.length > 0 && !loading) {
      // Multiple attempts to ensure TikTok loads on initial page load
      const loadTikTokForInitialLoad = () => {
        if (typeof window !== 'undefined') {
          // Process Instagram embeds
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
          
          // For TikTok, completely remove and reload script (same as filtering)
          const existingScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
          if (existingScript) {
            existingScript.remove();
          }
          
          // Add new TikTok script (exactly like the filtering process)
          const newScript = document.createElement('script');
          newScript.src = 'https://www.tiktok.com/embed.js';
          newScript.async = true;
          
          newScript.onload = () => {
            console.log('Initial TikTok script loaded successfully');
          };
          
          newScript.onerror = () => {
            console.error('Initial TikTok script failed, retrying...');
            // Retry once more
            setTimeout(() => {
              const retryScript = document.createElement('script');
              retryScript.src = 'https://www.tiktok.com/embed.js';
              retryScript.async = true;
              document.body.appendChild(retryScript);
            }, 1000);
          };
          
          document.body.appendChild(newScript);
        }
      };
      
      // Try multiple times with different delays
      const timer1 = setTimeout(loadTikTokForInitialLoad, 1000);
      const timer2 = setTimeout(loadTikTokForInitialLoad, 2500);
      const timer3 = setTimeout(loadTikTokForInitialLoad, 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [videos, loading]); // Run when videos are loaded and loading is complete

  // Fetch videos from API
  useEffect(() => {
    fetchVideos();
  }, []);

  // Filter + Search using useMemo for stability
  const filteredVideos = useMemo(() => {
    const base = videos.filter((video) => {
      // Apply content filters (OR within groups, AND between groups)
      let passesContentFilter = true;
      if (activeFilters.length > 0) {
        const filterGroups = activeFilters.reduce((groups: Record<string, string[]>, f) => {
          if (!groups[f.type]) groups[f.type] = [];
          groups[f.type].push(f.value);
          return groups;
        }, {} as Record<string, string[]>);

        passesContentFilter = Object.entries(filterGroups).every(([filterType, values]) => {
          switch (filterType) {
            case "category":
              return values.includes(video.category);
            case "focus":
              return values.includes(video.focus);
            case "mood":
              return values.includes(video.mood);
            case "sponsoredContent":
              return values.some((v) => (v === "None" ? video.sponsoredContent === null : video.sponsoredContent === v));
            default:
              return true;
          }
        });
      }

      // Apply orientation filter
      let passesOrientationFilter = true;
      if (orientationFilter === "vertical") {
        passesOrientationFilter = video.platform === "TikTok" || video.platform === "Instagram";
      } else if (orientationFilter === "horizontal") {
        passesOrientationFilter = video.platform === "Youtube";
      }

      return passesContentFilter && passesOrientationFilter;
    });

    // Apply search if query length >= 2
    const q = searchQuery.trim();
    if (q.length < 2) return base;
    const tokens = tokenizeQuery(q);
    const scored = base
      .map((v) => ({ v, s: scoreVideo(v, tokens) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ v }) => v);

    return scored;
  }, [videos, activeFilters, orientationFilter, searchQuery, tokenizeQuery]);

  const displayedVideos = useMemo(() => {
    const count = isMdUp ? desktopVisibleCount : mobileVisibleCount;
    const fallback = isMdUp ? 25 : 10;
    const safeCount = Number.isFinite(count) && count > 0 ? count : fallback;
    const sliced = filteredVideos.slice(0, safeCount);
    if (sliced.length === 0 && filteredVideos.length > 0) {
      return filteredVideos.slice(0, Math.min(fallback, filteredVideos.length));
    }
    return sliced;
  }, [filteredVideos, isMdUp, mobileVisibleCount, desktopVisibleCount]);

  // Reset counts when results or breakpoint change
  useEffect(() => {
    setDesktopVisibleCount(25);
    setMobileVisibleCount(10);
  }, [filteredVideos]);

  // Ensure counts never become invalid
  useEffect(() => {
    if (isMdUp) {
      if (!Number.isFinite(desktopVisibleCount) || desktopVisibleCount <= 0) {
        setDesktopVisibleCount(25);
      }
    } else {
      if (!Number.isFinite(mobileVisibleCount) || mobileVisibleCount <= 0) {
        setMobileVisibleCount(10);
      }
    }
  }, [mobileVisibleCount, desktopVisibleCount, isMdUp]);

  // Re-process embeds when loading more so new items initialize (mobile and desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        const ig = (window as unknown as { instgrm?: { Embeds?: { process?: () => void } } }).instgrm;
        if (ig && ig.Embeds && typeof ig.Embeds.process === 'function') {
          ig.Embeds.process();
        }
      } catch {}
      try {
        const existingScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (existingScript) {
          existingScript.remove();
        }
        const newScript = document.createElement('script');
        newScript.src = 'https://www.tiktok.com/embed.js';
        newScript.async = true;
        document.body.appendChild(newScript);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [mobileVisibleCount, desktopVisibleCount]);

  // Process embeds when filtering changes (not on initial load)
  useEffect(() => {
    if (videos.length > 0 && typeof window !== 'undefined' && !loading) {
      const timer = setTimeout(() => {
        // Re-process Instagram embeds
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        
        // For TikTok, reload the script to process filtered embeds
        const existingScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (existingScript) {
          existingScript.remove();
        }
        
        const newScript = document.createElement('script');
        newScript.src = 'https://www.tiktok.com/embed.js';
        newScript.async = true;
        document.body.appendChild(newScript);
      }, 800); // Slightly faster for filter changes

      return () => clearTimeout(timer);
    }
  }, [filteredVideos]); // Only run when filtered videos change, not on initial load

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
    setGlobalLoading(true);
    
    // Apply filter immediately so content can load behind the overlay
    setActiveFilters(prevFilters => {
      const existingFilterIndex = prevFilters.findIndex(f => f.type === type && f.value === value);
      
      if (existingFilterIndex !== -1) {
        // If same filter is clicked again, remove it
        return prevFilters.filter((_, index) => index !== existingFilterIndex);
      } else {
        // Check if there's already a filter of this type
        const existingTypeIndex = prevFilters.findIndex(f => f.type === type);
        
        if (existingTypeIndex !== -1) {
          // Replace existing filter of this type (OR within same group)
          const newFilters = [...prevFilters];
          newFilters[existingTypeIndex] = { type, value };
          return newFilters;
        } else {
          // Add new filter (AND between different groups)
          return [...prevFilters, { type, value }];
        }
      }
    });
    
    // Hide loading overlay after 3 seconds
    setTimeout(() => {
      setGlobalLoading(false);
    }, 3000);
  };

  // Clear all filters
  const clearFilters = () => {
    setGlobalLoading(true);
    
    // Clear all filters immediately so content can load behind the overlay
    setActiveFilters([]);
    
    // Hide loading overlay after 3 seconds
    setTimeout(() => {
      setGlobalLoading(false);
    }, 3000);
  };

  // Remove specific filter
  const removeFilter = (type: string, value: string) => {
    setGlobalLoading(true);
    
    setActiveFilters(prevFilters => 
      prevFilters.filter(f => !(f.type === type && f.value === value))
    );
    
    // Hide loading overlay after 3 seconds
    setTimeout(() => {
      setGlobalLoading(false);
    }, 3000);
  };

  // Handle orientation filter with loading
  const handleOrientationFilter = (orientation: "all" | "vertical" | "horizontal") => {
    setGlobalLoading(true);
    
    // Apply orientation filter immediately so content can load behind the overlay
    setOrientationFilter(orientation);
    
    // Hide loading overlay after 3 seconds
    setTimeout(() => {
      setGlobalLoading(false);
    }, 3000);
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

  // Search handlers
  const handleSearchSubmit = () => {
    const val = (searchInputRef.current?.value || "").trim();
    setSearchQuery(val);
    setSearchInput(val);
  };
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearchSubmit();
  };
  const handleSearchClear = () => {
    setSearchInput("");
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
      searchInputRef.current.focus();
    }
  };

  // SearchBar (pill-styled)
  const SearchBar = () => (
    <div className="w-full max-w-[32rem] px-6">
      <div className="flex items-center rounded-full border-2 border-white text-white font-bold px-3 py-1 md:py-2">
        <input
          type="text"
          ref={searchInputRef}
          defaultValue={searchInput}
          onKeyDown={handleSearchKey}
          autoComplete="off"
          placeholder="Search titles, creators, categories..."
          className="flex-1 bg-transparent outline-none placeholder-gray-400 text-white font-bold"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSearchSubmit}
          aria-label="Search"
          className="ml-2 text-white"
        >
          🔍
        </button>
        {searchQuery && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSearchClear}
            aria-label="Clear search"
            className="ml-2 text-white"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white">
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center">
          <img 
            src="/blueprintB.svg" 
            alt="Blueprint" 
            className="h-6 w-auto sm:h-7 md:h-8"
          />
        </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
              <span className="px-3 py-1 text-sm text-gray-500">All</span>
              <span className="px-3 py-1 text-sm text-gray-500">Vertical</span>
              <span className="px-3 py-1 text-sm text-gray-500">Horizontal</span>
            </div>
          </div>
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
                      className="block w-full text-left text-3xl font-bold text-gray-500"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus */}
              <div className="text-center">
                <h3 className="text-base text-gray-400 mb-2 font-bold text-left">Focus</h3>
                <div className="space-y-1">
                  {filterOptions.focus.map((focus) => (
                    <button
                      key={focus}
                      className="block w-full text-left text-3xl font-bold text-gray-500"
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
                      className="block w-full text-left text-3xl font-bold text-gray-500"
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
                      className="block w-full text-left text-3xl font-bold text-gray-500"
                    >
                      {content}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section with Loading Overlay */}
        <div className="px-6 relative">
          <GlobalLoadingOverlay />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white">
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center">
          <img 
            src="/blueprintB.svg" 
            alt="Blueprint" 
            className="h-6 w-auto sm:h-7 md:h-8"
          />
        </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
              <span className="px-3 py-1 text-sm text-gray-500">All</span>
              <span className="px-3 py-1 text-sm text-gray-500">Vertical</span>
              <span className="px-3 py-1 text-sm text-gray-500">Horizontal</span>
            </div>
          </div>
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
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/blueprintB.svg" 
            alt="Blueprint" 
            className="h-6 w-auto sm:h-7 md:h-8"
          />
        </div>
        <div className="flex-1 flex justify-center">
          {isMdUp && <SearchBar />}
        </div>
        {/* Orientation Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1a1a1a] rounded-lg p-1">
            <button
              onClick={() => handleOrientationFilter("all")}
              className={`px-3 py-1 text-sm rounded transition-all ${
                orientationFilter === "all"
                  ? "bg-white text-black"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleOrientationFilter("vertical")}
              className={`px-3 py-1 text-sm rounded transition-all ${
                orientationFilter === "vertical"
                  ? "bg-white text-black"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => handleOrientationFilter("horizontal")}
              className={`px-3 py-1 text-sm rounded transition-all ${
                orientationFilter === "horizontal"
                  ? "bg-white text-black"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Horizontal
            </button>
          </div>
        </div>
      </header>
      {!isMdUp && (
        <div className="flex justify-center mb-4">
          <SearchBar />
        </div>
      )}

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
                      activeFilters.some(f => f.type === 'category' && f.value === category)
                        ? 'text-gray-400'
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
              <div className="space-y-1">
                {filterOptions.focus.map((focus) => (
                  <button
                    key={focus}
                    onClick={() => handleFilterSelect('focus', focus)}
                    className={`block w-full text-left text-3xl font-bold transition-colors ${
                      activeFilters.some(f => f.type === 'focus' && f.value === focus)
                        ? 'text-gray-500'
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
                      activeFilters.some(f => f.type === 'mood' && f.value === mood)
                        ? 'text-gray-500'
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
                      activeFilters.some(f => f.type === 'sponsoredContent' && f.value === content)
                        ? 'text-gray-500'
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

        {/* Mobile/Tablet Filters - 2x2 Grid of Dropdowns */}
        <div className="lg:hidden px-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMobileFilterGroup(mobileFilterGroup === 'category' ? null : 'category')}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg p-3 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <span className="text-white font-medium">Categories</span>
                <span className="text-gray-400">
                  {mobileFilterGroup === 'category' ? '−' : '+'}
                </span>
              </button>
              {mobileFilterGroup === 'category' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    {filterOptions.category.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleFilterSelect('category', category)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                          activeFilters.some(f => f.type === 'category' && f.value === category)
                            ? 'text-gray-400 bg-gray-800'
                            : 'text-white hover:text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Focus Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMobileFilterGroup(mobileFilterGroup === 'focus' ? null : 'focus')}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg p-3 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <span className="text-white font-medium">Focus</span>
                <span className="text-gray-400">
                  {mobileFilterGroup === 'focus' ? '−' : '+'}
                </span>
              </button>
              {mobileFilterGroup === 'focus' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    {filterOptions.focus.map((focus) => (
                      <button
                        key={focus}
                        onClick={() => handleFilterSelect('focus', focus)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                          activeFilters.some(f => f.type === 'focus' && f.value === focus)
                            ? 'text-gray-400 bg-gray-800'
                            : 'text-white hover:text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {focus}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mood Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMobileFilterGroup(mobileFilterGroup === 'mood' ? null : 'mood')}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg p-3 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <span className="text-white font-medium">Mood</span>
                <span className="text-gray-400">
                  {mobileFilterGroup === 'mood' ? '−' : '+'}
                </span>
              </button>
              {mobileFilterGroup === 'mood' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    {filterOptions.mood.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => handleFilterSelect('mood', mood)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                          activeFilters.some(f => f.type === 'mood' && f.value === mood)
                            ? 'text-gray-400 bg-gray-800'
                            : 'text-white hover:text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sponsored Content Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMobileFilterGroup(mobileFilterGroup === 'sponsoredContent' ? null : 'sponsoredContent')}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg p-3 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <span className="text-white font-medium">Sponsored Content</span>
                <span className="text-gray-400">
                  {mobileFilterGroup === 'sponsoredContent' ? '−' : '+'}
                </span>
              </button>
              {mobileFilterGroup === 'sponsoredContent' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    {filterOptions.sponsoredContent.map((content) => (
                      <button
                        key={content}
                        onClick={() => handleFilterSelect('sponsoredContent', content)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                          activeFilters.some(f => f.type === 'sponsoredContent' && f.value === content)
                            ? 'text-gray-400 bg-gray-800'
                            : 'text-white hover:text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {content}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Combined Filter Pills and Info */}
      <FilterPillsAndInfo />

      {/* Search Bar */}
      {/* SearchBar is now in the header on larger screens */}

      {/* Videos Grid */}
      <div className="px-6 relative">
        {/* Global Loading Overlay - only covers videos section */}
        {globalLoading && <GlobalLoadingOverlay />}
        
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base font-bold text-gray-400">No Matches</p>
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {displayedVideos.map((video) => (
                <div key={video._id} className="break-inside-avoid bg-[#1a1a1a] rounded-lg overflow-hidden shadow-lg border border-[#333]">
                  {/* Video Embed */}
                  {video.platform === "TikTok" ? (
                    <div className="w-full bg-[#1a1a1a] flex justify-center items-start" style={{ 
                      minHeight: 'calc(min(323px, 85vw) * 16/9)',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: 'min(323px, 85vw)', 
                        maxWidth: '323px',
                        aspectRatio: '9/16' 
                      }}>
                        {renderVideo(video)}
                      </div>
                    </div>
                  ) : (
                  <div className="w-full">
                    {renderVideo(video)}
                  </div>
                  )}
                  
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
            {displayedVideos.length > 0 && displayedVideos.length < filteredVideos.length && (
              <div className="flex justify-center py-6">
                <button
                  onClick={() => {
                    const prevCount = isMdUp
                      ? (Number.isFinite(desktopVisibleCount) && desktopVisibleCount > 0 ? desktopVisibleCount : 25)
                      : (Number.isFinite(mobileVisibleCount) && mobileVisibleCount > 0 ? mobileVisibleCount : 10);
                    const increment = isMdUp ? 25 : 10;
                    const nextCount = Math.min(prevCount + increment, filteredVideos.length);
                    if (isMdUp) {
                      setDesktopVisibleCount(nextCount);
                    } else {
                      setMobileVisibleCount(nextCount);
                    }
                  }}
                  className="border-2 border-white text-white font-bold rounded-full px-5 py-2 hover:bg-white hover:text-black transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
