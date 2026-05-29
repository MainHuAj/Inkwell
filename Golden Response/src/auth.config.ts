import type { NextAuthConfig } from "next-auth";

// Edge-safe portion of the Auth.js config. It deliberately contains NO Node-only
// imports (argon2, Prisma) so it can run inside middleware on the edge runtime.
// The Credentials provider with its authorize() lives in ./auth.ts.

// Routes that require a signed-in user. A logged-out visitor can still read
// posts, profiles, tags, and search.
const PROTECTED_PREFIXES = ["/compose", "/dashboard", "/settings"];

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string) ?? "";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname, search } = request.nextUrl;
      const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
      if (needsAuth && !isLoggedIn) {
        const url = new URL("/login", request.nextUrl);
        url.searchParams.set("callbackUrl", pathname + search);
        return Response.redirect(url);
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
