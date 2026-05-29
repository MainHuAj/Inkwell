import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Log in — Inkwell" };

export default function LoginPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center py-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">Log in to write, comment, and save posts.</p>
      </div>
      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
