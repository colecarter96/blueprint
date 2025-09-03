"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SignInModal({ open, onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailKnown, setEmailKnown] = useState<boolean | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Detect whether email already has sign-in methods
  useEffect(() => {
    setEmailKnown(null);
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    const t = setTimeout(async () => {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, trimmed);
        setEmailKnown((methods || []).length > 0);
      } catch {
        setEmailKnown(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [email]);

  if (!open) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        if (password !== confirm) {
          throw new Error("Passwords do not match");
        }
        await signUpWithEmail(email, password);
      }
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

  const handleResetPassword = async () => {
    setError(null);
    setResetMsg(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter your email to reset your password");
      return;
    }
    setBusy(true);
    try {
      const continueUrl = typeof window !== "undefined" ? window.location.origin : "";
      await sendPasswordResetEmail(auth, trimmed, { url: continueUrl });
      setResetMsg("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email");
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
        {resetMsg && <div className="text-green-400 text-sm mb-2">{resetMsg}</div>}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            className="w-full bg-[#2a2a2a] text-white rounded px-3 py-2 outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              className="w-full bg-[#2a2a2a] text-white rounded px-3 py-2 pr-10 outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              aria-label={showPwd ? "Hide password" : "Show password"}
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
            >
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>
          {mode === "signup" && (
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full bg-[#2a2a2a] text-white rounded px-3 py-2 pr-10 outline-none"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
              >
                {showConfirm ? "🙈" : "👁"}
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-white text-black font-bold rounded py-2 disabled:opacity-60"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        {mode === "signin" && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={busy}
              className="text-sm text-gray-300 underline hover:text-white disabled:opacity-60"
            >
              Forgot password?
            </button>
          </div>
        )}
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
            <button
              className={`underline ${email && email.includes("@") && emailKnown === false ? "text-white font-bold" : ""}`}
              onClick={() => setMode("signup")}
            >
              Create an account
            </button>
          ) : (
            <button className="underline" onClick={() => setMode("signin")}>Already have an account? Sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

