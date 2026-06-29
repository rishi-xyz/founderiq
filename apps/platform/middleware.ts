import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const hasCookie = request.cookies.has("access_token")
  const { pathname } = request.nextUrl

  const publicPaths = ["/login", "/register"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!hasCookie && !isPublic) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (hasCookie && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|_static|_vercel|favicon.ico|.*\\..*).*)"],
}
