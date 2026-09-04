/**
 * GET /api/extension-token
 *
 * Returns the current user's Supabase access token so the Chrome extension
 * can authenticate itself. The extension fetches this endpoint while the
 * user is logged into the dashboard.
 *
 * Only accessible from localhost — blocked in production automatically
 * because the extension host_permissions only allow localhost:3000.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Allow the extension to fetch this cross-origin
  return NextResponse.json(
    {
      access_token: session.access_token,
      user_id: session.user.id,
      email: session.user.email,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    }
  );
}
