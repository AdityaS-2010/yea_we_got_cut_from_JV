// app/profile/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 1. Get session
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!currentSession) {
        router.push("/auth/login");
        return;
      }

      setSession(currentSession);
      const userId = currentSession.user.id;

      // 2. Try to load existing profile
      const {
        data: existingProfile,
        error: selectError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (selectError) {
        setError(selectError.message);
        setLoading(false);
        return;
      }

      // 3. If no profile row, create one
      if (!existingProfile) {
        const {
          data: newProfile,
          error: insertError,
        } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            display_name: currentSession.user.email?.split("@")[0] ?? null,
            headline: null,
            skills: null,
            bio: null,
          })
          .select("*")
          .single();

        if (insertError) {
          setError(insertError.message);
          setLoading(false);
          return;
        }

        setProfile(newProfile as Profile);
      } else {
        setProfile(existingProfile as Profile);
      }

      setLoading(false);
    };

    init();
  }, [router]);
  useEffect(() => {
  if (!success) return;

  const timer = setTimeout(() => {
    setSuccess(null);
  }, 3000); // 3 seconds

  return () => clearTimeout(timer);
}, [success]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        headline: profile.headline,
        skills: profile.skills,
        bio: profile.bio,
      })
      .eq("id", session.user.id)
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setProfile(data as Profile);
    setSuccess("Profile saved");
    setIsEditing(false); // go back to view mode
  };

  if (loading) {
    return <p className="text-slate-300">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="text-red-400">Could not load profile.</p>;
  }

  const skillsList =
    profile.skills
      ?.split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0) ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-xs text-slate-400">
            Signed in as{" "}
            <span className="text-slate-200">{session?.user.email}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* VIEW MODE */}
      {!isEditing && (
        <div className="space-y-4 rounded border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {profile.display_name || session?.user.email}
              </h2>
              {profile.headline && (
                <p className="text-sm text-slate-300 mt-1">
                  {profile.headline}
                </p>
              )}
            </div>

            <button
              className="rounded border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
              onClick={() => {
                setSuccess(null);
                setError(null);
                setIsEditing(true);
              }}
            >
              Edit profile
            </button>
          </div>

          {skillsList.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Bio</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {(!profile.headline && skillsList.length === 0 && !profile.bio) && (
            <p className="text-xs text-slate-500">
              Your profile is a bit empty. Click{" "}
              <span className="font-semibold">Edit profile</span> to add more
              about yourself.
            </p>
          )}

          {success && (
            <p className="
                mt-2 text-sm text-emerald-400 border border-emerald-700 rounded p-2 
                bg-emerald-950/40 transition-opacity duration-500 ease-out opacity-100
            ">
              {success}
            </p>
          )}
        </div>
      )}

      {/* EDIT MODE */}
      {isEditing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Edit profile</h2>
            <button
              type="button"
              className="rounded border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
              onClick={() => {
                setIsEditing(false);
                setSuccess(null);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-300">Display name</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={profile.display_name ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, display_name: e.target.value })
              }
              placeholder="e.g. Aditya Srivastava"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Headline</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={profile.headline ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, headline: e.target.value })
              }
              placeholder="e.g. Founder and Creator"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">
              Skills (comma-separated)
            </label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={profile.skills ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, skills: e.target.value })
              }
              placeholder="JS, TS, HTML, ..."
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Bio</label>
            <textarea
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              rows={4}
              value={profile.bio ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, bio: e.target.value })
              }
              placeholder="Tell people what you like working on, your interests, etc."
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 border border-red-700 rounded p-2 bg-red-950/40">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      )}
    </div>
  );
}
