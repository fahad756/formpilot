"use client";

/**
 * OAuth callback page — exchanges the authorization code for a session.
 *
 * Supabase redirects here after Google OAuth completes. The @supabase/ssr
 * browser client detects the code in the URL, exchanges it automatically,
 * and updates the session. We then redirect to the dashboard.
 *
 * If the exchange fails (e.g., code already used), we show an error and
 * redirect back to login so the user can try again.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Zap } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        router.replace("/?auth_error=1");
      } else {
        router.replace("/dashboard");
      }
    });
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
