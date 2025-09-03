"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../../lib/firebaseClient";
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user && !cred.user.displayName) {
      await updateProfile(cred.user, { displayName: email.split("@")[0] });
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

