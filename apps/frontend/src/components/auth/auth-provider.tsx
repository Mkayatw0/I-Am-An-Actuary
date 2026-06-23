"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/auth/store";
import { getProfile } from "@/lib/auth/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // 1. Check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) {
        try {
          const profile = await getProfile(session.access_token);
          setUser(profile);
        } catch {
          // Token expired or invalid — clear
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    // 2. Listen for auth state changes (login / logout events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.access_token) {
          try {
            const profile = await getProfile(session.access_token);
            setUser(profile);
          } catch {
            setUser(null);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}