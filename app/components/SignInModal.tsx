"use client";

import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SignInModal({ open, onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] text-white w-full max-w-sm mx-4 rounded-lg p-5 shadow-lg">
        <h2 className="text-xl font-bold mb-3">{mode === "signin" ? "Sign in" : "Sign up"}</h2>
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            className="w-full bg-[#2a2a2a] text-white rounded px-3 py-2 outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full bg-[#2a2a2a] text-white rounded px-3 py-2 outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-white text-black font-bold rounded py-2 disabled:opacity-60"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="my-3 text-center text-gray-400 text-sm">or</div>
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full bg-[#2a2a2a] border border-white text-white font-bold rounded py-2 disabled:opacity-60"
        >
          Continue with Google
        </button>
        <div className="mt-4 text-center text-sm text-gray-400">
          {mode === "signin" ? (
            <button className="underline" onClick={() => setMode("signup")}>Create an account</button>
          ) : (
            <button className="underline" onClick={() => setMode("signin")}>Already have an account? Sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

