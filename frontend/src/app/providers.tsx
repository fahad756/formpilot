"use client";

/**
 * Global provider tree for the Next.js app.
 *
 * Wraps the entire application with:
 *   - QueryClientProvider (TanStack Query for data fetching)
 *
 * Supabase auth state is accessed via useAuth hook, not a React context,
 * because Supabase's onAuthStateChange handles subscriptions internally.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to avoid sharing state between SSR requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,   // 1 minute default staleness
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
