"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Login successful!
    router.push("/feed");
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Log in</h1>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="text-sm">Email</label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input
            type="password"
            required
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm border border-red-800 p-2 rounded bg-red-950/40">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded bg-slate-100 px-3 py-2 font-medium text-slate-900 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="text-sm text-slate-400">
        Don’t have an account?
        <a href="/auth/register" className="text-slate-200 underline ml-1">
          Create one
        </a>
      </p>
    </div>
  );
}
