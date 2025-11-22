"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Account created! You can now log in.");
    // Redirect after a second
    setTimeout(() => router.push("/auth/login"), 1000);
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Create an account</h1>

      <form className="space-y-4" onSubmit={handleSignup}>
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
            minLength={6}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Password must be at least 6 characters.
          </p>
        </div>

        {error && (
          <p className="text-red-400 text-sm border border-red-800 p-2 rounded bg-red-950/40">
            {error}
          </p>
        )}

        {message && (
          <p className="text-emerald-400 text-sm border border-emerald-800 p-2 rounded bg-emerald-950/40">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded bg-slate-100 px-3 py-2 font-medium text-slate-900 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-slate-400">
        Already have an account?
        <a href="/auth/login" className="text-slate-200 underline ml-1">
          Log in instead
        </a>
      </p>
    </div>
  );
}
