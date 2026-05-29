"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/client";
import { registerSchema } from "@/lib/validations";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = React.useState({ name: "", username: "", email: "", password: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    // Client-side validation mirrors the server (which validates again).
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      // Auto log in after successful registration.
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Couldn't create your account. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Field
        id="name"
        label="Display name"
        value={form.name}
        autoComplete="name"
        onChange={(v) => update("name", v)}
        error={errors.name}
      />
      <Field
        id="username"
        label="Username"
        value={form.username}
        autoComplete="username"
        onChange={(v) => update("username", v)}
        error={errors.username}
        hint="Lowercase letters, numbers, and underscores."
      />
      <Field
        id="email"
        label="Email"
        type="email"
        value={form.email}
        autoComplete="email"
        onChange={(v) => update("email", v)}
        error={errors.email}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        value={form.password}
        autoComplete="new-password"
        onChange={(v) => update("password", v)}
        error={errors.password}
        hint="At least 8 characters."
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
