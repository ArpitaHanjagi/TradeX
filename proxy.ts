import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const authRoutes = ["/sign-in", "/sign-up"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = getSessionCookie(request);
    const isAuthRoute = authRoutes.includes(pathname);

    if (!sessionCookie && !isAuthRoute) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (sessionCookie && isAuthRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets|public).*)"],
};
