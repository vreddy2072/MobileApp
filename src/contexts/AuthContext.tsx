import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { initializeSupabase, getSupabaseClient, createSessionFromUrl } from '../../lib/supabase';
import { getSupabaseUrl, getSupabaseAnonKey } from '../services/envService';
import { useAuthStore } from '../state/authStore';
import { logUserLogin } from '../services/userLoginService';

interface AuthContextValue {
  session: Session | null;
  userId: string | null;
  isSignedIn: boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const userId = session?.user?.id ?? null;
  const isSignedIn = !!session;

  useEffect(() => {
    let mounted = true;

    async function init() {
      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();
      if (url && key) {
        initializeSupabase(url, key);
        const client = getSupabaseClient();
        if (client && mounted) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl && (initialUrl.includes('access_token') || initialUrl.includes('auth-callback'))) {
            try {
              await createSessionFromUrl(initialUrl);
              WebBrowser.maybeCompleteAuthSession();
            } catch (_) {}
          }
          const { data: { session: initialSession } } = await client.auth.getSession();
          setSession(initialSession);
          setAuth(initialSession?.user?.id ?? null, initialSession?.access_token ?? null);
          if (initialSession?.user?.id) {
            logUserLogin(initialSession.user.id).catch(() => {});
          }
        }
      }
      if (mounted) setAuthLoaded(true);
    }

    init();
    return () => { mounted = false; };
  }, [setAuth]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuth(newSession?.user?.id ?? null, newSession?.access_token ?? null);
      if (newSession?.user?.id) {
        logUserLogin(newSession.user.id).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth]);

  const value: AuthContextValue = {
    session,
    userId,
    isSignedIn,
    isLoaded: authLoaded,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
