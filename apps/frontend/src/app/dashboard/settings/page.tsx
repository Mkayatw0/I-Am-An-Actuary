"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuthStore } from "@/lib/auth/store";
import { updateProfile } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@repo/shared-types";

const USER_TYPES: { value: UserType; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "actuary", label: "Actuary" },
  { value: "investor", label: "Investor" },
  { value: "general_user", label: "General User" },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [userType, setUserType] = useState<UserType>(user?.user_type ?? "student");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const updated = await updateProfile(token, {
        full_name: fullName,
        user_type: userType,
      });
      setUser(updated);
      setMessage("Profile updated successfully.");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-md space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium">
                User Type
              </label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {USER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.includes("successfully")
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}