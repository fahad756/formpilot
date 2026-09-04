"use client";

/**
 * Root landing page — redirects authenticated users to the dashboard
 * and shows a minimal landing screen for guests.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";
import { Zap } from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <span className="text-3xl font-bold text-text-base tracking-tight">FormPilot</span>
      </div>

      {/* Hero copy */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-text-base leading-tight max-w-xl">
        Stop retyping your life story.
      </h1>
      <p className="mt-5 text-lg text-text-muted text-center max-w-md">
        FormPilot fills any job application form in one click, directly from
        your Chrome browser — using your stored profile and selected resume.
      </p>

      {/* CTA */}
      <button
        onClick={signInWithGoogle}
        className="mt-10 flex items-center gap-3 bg-white border border-border shadow-card hover:shadow-card-hover transition-shadow rounded-xl px-6 py-3.5 text-text-base font-semibold text-base"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p className="mt-8 text-sm text-text-muted text-center max-w-sm">
        Free forever · No credit card · Works on 500+ job boards
      </p>
    </main>
  );
}
