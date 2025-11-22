"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Load session on mount
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
    };

    loadSession();

    // Listen for login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="border-b border-slate-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          CrewUp
        </Link>

        <div className="flex items-center gap-4 text-sm text-slate-300">
          <Link href="/feed">Feed</Link>
          <Link href="/projects">Projects</Link>

          {session && <Link href="/profile">My Profile</Link>}

          {!session && (
            <Link
              href="/auth/login"
              className="rounded bg-slate-100 px-3 py-1 text-slate-900 font-medium"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
