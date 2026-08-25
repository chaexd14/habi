import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname === "/";
  const isApiRoute = pathname.startsWith("/api");

  const sessionStartCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (user) {
    const sessionStartTime = sessionStartCookie ? parseInt(sessionStartCookie, 10) : null;
    const now = Date.now();

    // If session is already recorded, check if it has exceeded 8 hours
    if (sessionStartTime && now - sessionStartTime >= SESSION_MAX_AGE_MS) {
      await supabase.auth.signOut();

      if (isApiRoute) {
        const apiResponse = NextResponse.json(
          {
            success: false,
            error: "Your session has expired after 8 hours. Please log in again.",
            expired: true,
          },
          { status: 401 }
        );
        apiResponse.cookies.delete(SESSION_COOKIE_NAME);
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith("sb-")) {
            apiResponse.cookies.delete(cookie.name);
          }
        });
        return apiResponse;
      }

      const redirectResponse = NextResponse.redirect(
        new URL("/auth/login?expired=1", request.url)
      );
      redirectResponse.cookies.delete(SESSION_COOKIE_NAME);
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
          redirectResponse.cookies.delete(cookie.name);
        }
      });
      return redirectResponse;
    }

    if (!sessionStartTime) {
      response.cookies.set(SESSION_COOKIE_NAME, now.toString(), {
        path: "/",
        maxAge: 28800,
        sameSite: "lax",
      });
    }

    // If user has valid session and visits auth routes, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    // If unauthenticated user tries to access protected routes
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
