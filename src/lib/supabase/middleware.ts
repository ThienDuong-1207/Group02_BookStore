import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request (required by @supabase/ssr),
 * so Server Components always see a valid login.
 * Also guards /admin/** (US-13, layer 1): guests → /login, non-admins → /forbidden.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not put code between createServerClient and getClaims(): it refreshes the token if needed.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const path = request.nextUrl.pathname;
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!userId) {
      // E1: guest → login, then come back to the admin page.
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", path);
      return redirectKeepingCookies(loginUrl, response);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", userId)
      .maybeSingle<{ role: string; status: string }>();
    if (profile?.role !== "ADMIN" || profile.status !== "ACTIVE") {
      // E2 / B1: customer, or admin locked while logged in → 403 page.
      return redirectKeepingCookies(new URL("/forbidden", request.url), response);
    }
  }

  return response;
}

/** A redirect must carry the refreshed session cookies, otherwise the user is logged out by accident. */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
