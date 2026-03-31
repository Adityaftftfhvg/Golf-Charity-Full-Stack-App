import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const getToken = () =>
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get(
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}-auth-token`
    )?.value;

  if (pathname.startsWith("/dashboard")) {
    const token = getToken();
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    const token = getToken();
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};