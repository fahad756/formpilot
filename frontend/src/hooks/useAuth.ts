/**
 * useAuth — reactive hook for Supabase session state.
 *
 * Returns the current user and a loading flag. Subscribes to auth state
 * changes so components re-render automatically on login/logout without
 * manual polling or prop drilling.
 */

"use client";

import { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Bootstrap: read the existing session
    supabase.auth.getSession().then(({ data }) => {
      setState({
        user: data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
      });
    });

    // Subscribe to subsequent auth events (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session: session ?? null, loading: false });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return state;
}
