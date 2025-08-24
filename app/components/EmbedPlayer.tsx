"use client";

import React, { useEffect, useRef, useCallback } from "react";

export interface VideoData {
  _id: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  tags: string[];
  orientation: 'horizontal' | 'vertical';
  url: string;
  embedHtml?: string; // Only for Instagram
  dateAdded: string;
  // Additional fields that might be useful
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  viewCount?: number;
}

interface EmbedPlayerProps {
  video: VideoData;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export default function EmbedPlayer({ video, width = 560, height = 315, className = '', onLoad, onError }: EmbedPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Extract video ID from TikTok URL
  const getTikTokVideoId = (url: string): string | null => {
    const regex = /tiktok\.com\/@[^\/]+\/video\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Load Instagram embed script
  const loadInstagramScript = useCallback(() => {
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const script = document.createElement('script');
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load TikTok embed script
  const loadTikTokScript = useCallback(() => {
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load scripts when component mounts
  useEffect(() => {
    if (video.platform === 'tiktok') {
      loadTikTokScript();
    } else if (video.platform === 'instagram') {
      loadInstagramScript();
    }
  }, [video.platform, loadTikTokScript, loadInstagramScript]);

  // Render YouTube embed
  const renderYouTube = () => {
    const videoId = getYouTubeVideoId(video.url);
    if (!videoId) {
      onError?.('Invalid YouTube URL');
      return null;
    }

    return (
      <iframe
        width={width}
        height={height}
        src={`https://www.youtube.com/embed/${videoId}`}
        title={video.title || `YouTube video ${videoId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className={className}
        onLoad={onLoad}
      />
    );
  };

  // Render TikTok embed
  const renderTikTok = () => {
    const videoId = getTikTokVideoId(video.url);
    if (!videoId) {
      onError?.('Invalid TikTok URL');
      return null;
    }

    return (
      <blockquote
        className={`tiktok-embed ${className}`}
        cite={video.url}
        data-video-id={videoId}
        style={{ maxWidth: `${width}px`, minWidth: `${Math.min(width, 325)}px` }}
      >
        <section>
          <a target="_blank" title={`@${video.url.split('/@')[1]?.split('/')[0] || 'user'}`} href={video.url}>
            @{video.url.split('/@')[1]?.split('/')[0] || 'user'}
          </a>
          <p></p>
          <a target="_blank" title="♬ Original Sound" href={video.url}>
            ♬ Original Sound
          </a>
        </section>
      </blockquote>
    );
  };

  // Render Instagram embed
  const renderInstagram = () => {
    if (!video.embedHtml) {
      onError?.('Instagram embed HTML not provided');
      return null;
    }

    return (
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: video.embedHtml }}
        className={className}
        style={{ maxWidth: `${width}px` }}
      />
    );
  };

  // Render based on platform
  const renderEmbed = () => {
    switch (video.platform) {
      case 'youtube':
        return renderYouTube();
      case 'tiktok':
        return renderTikTok();
      case 'instagram':
        return renderInstagram();
      default:
        onError?.(`Unsupported platform: ${video.platform}`);
        return null;
    }
  };

  return (
    <div className={`embed-player ${className}`} data-platform={video.platform}>
      {renderEmbed()}
    </div>
  );
} 