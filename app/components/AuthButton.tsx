"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import SignInModal from "./SignInModal";

const avatarPalette = ["#FF00ED", "#002FFF", "#FBFF00", "#FF002B", "#1BC200"];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return Math.abs(hash);
}

export default function AuthButton() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "";
  const initial = (displayName || "?").charAt(0).toUpperCase();
  const color = useMemo(() => {
    const key = user?.uid || displayName || "anon";
    const idx = hashString(key) % avatarPalette.length;
    return avatarPalette[idx];
  }, [user?.uid, displayName]);

  if (!user) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1 text-sm rounded border border-white text-white hover:bg-white hover:text-black transition"
        >
          Sign in
        </button>
        <SignInModal open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: color }}>
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 bg-[#1a1a1a] border border-white rounded shadow-lg w-40 z-50">
          <div className="px-3 py-2 text-sm text-gray-300 truncate">{displayName}</div>
          <button
            onClick={async () => { await signOut(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-white hover:text-black"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

