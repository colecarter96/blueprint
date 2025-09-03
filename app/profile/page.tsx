"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebaseClient";

type Video = {
  _id: string;
  platform: string;
  title: string;
  user: string;
  views: number;
  likes?: number;
  category: string;
  focus: string;
  mood: string;
  sponsoredContent: string | null;
  rating: number;
  url: string;
  instaEmbed: string;
  tiktokEmbed: string;
};

function platformKind(p: string) {
  const k = (p || "").toLowerCase();
  if (k === "youtube") return "youtube" as const;
  if (k === "tiktok") return "tiktok" as const;
  if (k === "instagram") return "instagram" as const;
  return "other" as const;
}

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

const getUserInfo = (video: Video) => (video.user?.startsWith("@") ? video.user : `@${video.user}`);

// Simple in-viewport trigger copied style
function useInViewportTrigger(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);
  return [ref, shouldLoad] as const;
}

function InstagramLazyProfile({ video }: { video: Video }) {
  const [ref, shouldLoad] = useInViewportTrigger({ rootMargin: '600px 0px', threshold: 0.01 });
  useEffect(() => {
    if (shouldLoad) {
      try {
        if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
          const s = document.createElement('script');
          s.src = '//www.instagram.com/embed.js';
          s.async = true;
          document.body.appendChild(s);
        }
        if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
          window.instgrm.Embeds.process();
        }
      } catch {}
    }
  }, [shouldLoad]);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {shouldLoad && (
        <div dangerouslySetInnerHTML={{ __html: video.instaEmbed }} />
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<{ id: string; videoId: string }[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const AuthEntry = useMemo(() => dynamic(() => import('../components/AuthButton'), { ssr: false }), []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      // Read user's favorites: users/{uid}/favorites where docId arbitrary, store { videoId, createdAt }
      const q = query(collection(db, `users/${user.uid}/favorites`), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const favs: { id: string; videoId: string }[] = [];
      snap.forEach((d) => {
        const v = d.data() as any;
        if (v?.videoId) favs.push({ id: d.id, videoId: v.videoId });
      });
      setFavorites(favs);
      const ids = favs.map(f => f.videoId);
      if (ids.length) {
        const res = await fetch(`/api/videos/by-ids?ids=${encodeURIComponent(ids.join(","))}`);
        const data = await res.json();
        setVideos(data);
      } else {
        setVideos([]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Process embeds similarly to home: after videos change, re-run instgrm and reload TikTok script
  useEffect(() => {
    if (videos.length > 0 && typeof window !== 'undefined' && !loading) {
      const timer = setTimeout(() => {
        if (window.instgrm) {
          try { window.instgrm.Embeds.process(); } catch {}
        }

        const existingScript = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (existingScript) {
          try { existingScript.remove(); } catch {}
        }
        try {
          const newScript = document.createElement('script');
          newScript.src = 'https://www.tiktok.com/embed.js';
          newScript.async = true;
          document.body.appendChild(newScript);
        } catch {}
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [videos, loading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white flex items-center justify-center">
        {/* Centered animated blueprintB outline (same as home) */}
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
              style={{ animation: 'draw 3s ease-in-out infinite' as any }}
            />
          </g>
          <style>{`@keyframes draw{0%{stroke-dashoffset:400;opacity:.3}50%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:-400;opacity:.3}}`}</style>
        </svg>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white">
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" aria-label="Go home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/blueprintB.svg" alt="Blueprint" className="h-6 w-auto sm:h-7 md:h-8" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="px-3 py-1 text-sm rounded border border-white text-white hover:bg-white hover:text-black transition">Back to Home</Link>
          <div className="ml-1">
            <AuthEntry />
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{user.displayName || user.email?.split("@")[0] || "Profile"}</h1>
        <span className="text-gray-400">{favorites.length} saved</span>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading…</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">No saved videos yet.</div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {videos.map((video) => (
            <div key={video._id} className="break-inside-avoid bg-[#1a1a1a] rounded-lg overflow-hidden shadow-lg border border-[#333]">
              {/* Video Embed */}
              {platformKind(video.platform) === 'tiktok' ? (
                <div className="w-full bg-[#1a1a1a] flex justify-center items-start" style={{ 
                  minHeight: 'calc(min(323px, 85vw) * 16/9)',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: 'min(323px, 85vw)', 
                    maxWidth: '323px',
                    aspectRatio: '9/16' 
                  }}>
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: video.tiktokEmbed }} />
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {platformKind(video.platform) === 'youtube' ? (
                    (() => {
                      const yid = getYouTubeVideoId(video.url);
                      return yid ? (
                        <iframe
                          width="100%"
                          height="315"
                          src={`https://www.youtube.com/embed/${yid}`}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : <div>Invalid YouTube URL</div>;
                    })()
                  ) : (
                    <InstagramLazyProfile video={video} />
                  )}
                </div>
              )}

              {/* Video Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      platformKind(video.platform) === 'youtube' ? 'bg-red-600' :
                      platformKind(video.platform) === 'tiktok' ? 'bg-black' :
                      platformKind(video.platform) === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-700'
                    }`}>
                      {video.platform}
                    </span>
                    <span className="text-white font-medium">{getUserInfo(video)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 text-sm">
                    {platformKind(video.platform) === 'youtube' && (
                      <>{video.views.toLocaleString()} views</>
                    )}
                    {platformKind(video.platform) !== 'youtube' && typeof video.likes === 'number' && (
                      <>{video.likes.toLocaleString()} likes</>
                    )}
                    <RemoveFromBlueprintButton videoId={video._id} />
                  </div>
                </div>

                <h3 className="text-white font-medium mb-3 line-clamp-2">{video.title}</h3>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-[#333] text-gray-300 px-2 py-1 rounded text-xs">{video.category}</span>
                  <span className="bg-[#333] text-gray-300 px-2 py-1 rounded text-xs">{video.focus}</span>
                  <span className="bg-[#333] text-gray-300 px-2 py-1 rounded text-xs">{video.mood}</span>
                  {video.sponsoredContent && (
                    <span className="bg-yellow-600 text-black px-2 py-1 rounded text-xs font-medium">{video.sponsoredContent}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.floor(video.rating / 2) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
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
      )}
      </div>
    </div>
  );
}

function RemoveFromBlueprintButton({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [ctx, setCtx] = useState<{ favorites: { id: string; videoId: string }[]; setFavorites: React.Dispatch<React.SetStateAction<{ id: string; videoId: string }[]>> } | null>(null);
  // This button is defined in the same module; we will reach into the nearest state via closure if needed.
  // For simplicity, we just perform a best-effort delete of any one favorite matching this video.

  const onRemove = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // Find and delete one matching favorite doc
      // We cannot access parent's favorites here directly; perform a query-delete as fallback
      const col = collection(db, `users/${user.uid}/favorites`);
      const snap = await getDocs(col);
      let deleted = false;
      for (const d of snap.docs) {
        const v = d.data() as any;
        if (v?.videoId === videoId && !deleted) {
          await deleteDoc(doc(db, `users/${user.uid}/favorites/${d.id}`));
          deleted = true;
        }
      }
      // Reload page data
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onRemove}
      disabled={busy}
      className="px-2 py-1 border border-white rounded text-white text-xs hover:bg-white hover:text-black disabled:opacity-60"
      title="Remove from your blueprint"
    >
      −
    </button>
  );
}

