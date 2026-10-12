import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, DEV_AUTH } from "../lib/supabaseClient";
import { apiFetch } from "../lib/api";
import { clearGuestToken, peekGuestToken } from "../lib/guest";

const DEV_SESSION = {
  access_token: "dev",
  user: { id: "dev-user", email: "dev@localhost" },
} as unknown as Session;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * A person who tried it as a guest and then signs in keeps their image: the browser token proves it is
 * theirs, and the backend moves it into the account. Runs once, before the app shows the new session.
 */
async function claimGuestImage() {
  const token = peekGuestToken();
  if (!token) return;
  try {
    const res = await apiFetch<{ claimed: boolean }>("/guest/claim", {
      method: "POST",
      headers: { "X-Guest-Token": token },
    });
    if (res?.claimed) {
      try {
        sessionStorage.setItem("guestClaimed", "1");
      } catch {
        /* the notice is optional */
      }
    }
    clearGuestToken();
  } catch (err) {
    console.warn("Could not add the try-it image to the account:", err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (DEV_AUTH) {
      setSession(DEV_SESSION);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) console.warn("getSession error:", error.message);
      if (data.session) await claimGuestImage();
      setSession(data.session ?? null);
      setIsLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Supabase asks that no other auth calls run inside this callback, so hand off first.
      setTimeout(async () => {
        if (newSession && peekGuestToken()) {
          setIsLoading(true);
          await claimGuestImage();
        }
        setSession(newSession ?? null);
        setIsLoading(false);
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
