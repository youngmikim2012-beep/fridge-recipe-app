import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isApiRecipes = req.nextUrl.pathname.startsWith("/api/recipes");
  const isMypage = req.nextUrl.pathname.startsWith("/mypage");
  const isProfile = req.nextUrl.pathname.startsWith("/profile");

  if ((isApiRecipes || isMypage || isProfile) && !token) {
    if (isApiRecipes) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth", req.url));
  }
}

export const config = {
  matcher: ["/api/recipes/:path*", "/mypage/:path*", "/profile/:path*"],
};
