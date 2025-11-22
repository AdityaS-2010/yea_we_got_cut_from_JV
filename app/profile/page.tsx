"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!currentSession) {
        router.push("/auth/login"); // redirect if not logged in
        return;
      }

      setSession(currentSession);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  if (loading) {
    return <p className="text-slate-300">Loading profile...</p>;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      <p className="text-slate-300">
        <span className="font-medium text-slate-100">Email:</span>{" "}
        {session?.user.email}
      </p>

      <p className="text-slate-400 text-sm">
        (More profile fields coming soon — username, bio, skills, etc.)
      </p>

      <button
        className="mt-4 rounded bg-slate-100 px-3 py-2 text-slate-900 font-medium"
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/");
        }}
      >
        Log out
      </button>
    </div>
  );
}
