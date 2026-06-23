"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth/store";

export default function HomePage() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold tracking-tight">I Am An Actuary</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Welcome back, {user.full_name}
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight">I Am An Actuary</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        AI-powered actuarial study platform
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/auth/login"
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-md border border-border bg-card px-6 py-2 text-sm font-medium hover:bg-accent"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}