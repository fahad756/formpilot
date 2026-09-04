"use client";

/**
 * OAuth callback at /auth/callback — this is the URL registered in both
 * Google Cloud Console and Supabase as the redirect URI.
 *
 * Supabase detects the ?code= param, exchanges it for a session automatically,
 * then we redirect to the dashboard.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Zap } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Give Supabase SSR a moment to exchange the code, then check session
    const exchange = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        // Code may still be processing — retry once after short delay
        await new Promise((r) => setTimeout(r, 1500));
        const retry = await supabase.auth.getSession();
        if (!retry.data.session) {
          router.replace("/?auth_error=1");
          return;
        }
      }
      router.replace("/dashboard");
    };
    exchange();
  }, [router]);

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-5">
      <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
        <Zap className="w-7 h-7 text-white" />
      </div>
      <div className="flex items-center gap-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <span className="text-sm">Signing you in…</span>
      </div>
    </div>
  );
}
