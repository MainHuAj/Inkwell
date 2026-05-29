import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Runs the edge-safe Auth.js config so the `authorized` callback can gate
// protected routes (compose, dashboard, settings) before they render.
export default NextAuth(authConfig).auth;

export const config = {
  // Skip API routes (they do their own authz), Next internals, and uploads.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
