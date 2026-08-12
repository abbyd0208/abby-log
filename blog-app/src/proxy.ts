import { NextResponse, type NextRequest } from "next/server";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function unauthorized(message = "需要登入才能查看草稿。") {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Abby.log drafts", charset="UTF-8"',
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/drafts")) return NextResponse.next();

  const user = process.env.DRAFTS_USER?.trim();
  const password = process.env.DRAFTS_PASSWORD;

  if (!user || !password) {
    return new NextResponse(
      "草稿入口尚未啟用：請設定 DRAFTS_USER 與 DRAFTS_PASSWORD。",
      {
        status: 503,
        headers: {
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return unauthorized();

  try {
    const encoded = authorization.slice("Basic ".length);
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator < 0) return unauthorized();

    const inputUser = decoded.slice(0, separator);
    const inputPassword = decoded.slice(separator + 1);

    if (safeEqual(inputUser, user) && safeEqual(inputPassword, password)) {
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  } catch {
    return unauthorized();
  }

  return unauthorized("帳號或密碼不正確。");
}

export const config = {
  matcher: ["/drafts/:path*"],
};
