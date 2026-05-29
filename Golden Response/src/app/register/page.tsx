import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Sign up — Inkwell" };

export default function RegisterPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center py-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Join Inkwell</h1>
        <p className="mt-2 text-muted-foreground">
          One account. Full author, full reader — no gatekeeping.
        </p>
      </div>
      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
