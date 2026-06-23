"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/auth/store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    router.replace("/auth/login");
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </button>
          </div>

          {user && (
            <p className="text-muted-foreground">
              Welcome, {user.full_name} ({user.user_type.replace("_", " ")})
            </p>
          )}

          <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard href="/chat" title="Chat" />
            <DashboardCard href="/dashboard/student/tutor" title="Tutor" />
            <DashboardCard href="/dashboard/student/practice" title="Practice" />
            <DashboardCard href="/dashboard/student/formulas" title="Formulas" />
            <DashboardCard href="/dashboard/student/progress" title="Progress" />
            <DashboardCard
              href="/dashboard/professional/life-insurance"
              title="Life Insurance"
            />
            <DashboardCard
              href="/dashboard/professional/investments"
              title="Investments"
            />
            <DashboardCard
              href="/dashboard/professional/risk-management"
              title="Risk Management"
            />
            <DashboardCard href="/dashboard/settings" title="Settings" />
          </nav>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function DashboardCard({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
    </Link>
  );
}