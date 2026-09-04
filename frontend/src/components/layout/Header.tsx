"use client";

import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-end gap-4 shrink-0">
      {/* User avatar + dropdown */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={34}
              height={34}
              className="rounded-full ring-2 ring-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
          )}
          <span className="hidden sm:block text-sm text-text-base font-medium max-w-[140px] truncate">
            {displayName}
          </span>
        </button>

        {menuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-card-hover z-20 overflow-hidden">
              <button
                onClick={async () => { setMenuOpen(false); await signOut(); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-text-muted hover:bg-muted hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
