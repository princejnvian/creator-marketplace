"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const availableSkills = [
  "Video Editing",
  "Thumbnail Design",
  "Voice Over",
  "Shorts Editing",
  "Reels Editing",
  "YouTube Editing",
  "Motion Graphics",
  "Animation",
  "Graphic Design",
  "Script Writing",
];

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [accountType, setAccountType] = useState<
    "client" | "freelancer"
  >("client");

  const [skills, setSkills] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name, username, bio, account_type, skills, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");

        if (
          profile.account_type === "freelancer" ||
          profile.account_type === "client"
        ) {
          setAccountType(profile.account_type);
        }

        setSkills(profile.skills || []);
        setAvatarUrl(profile.avatar_url || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  // Upload profile picture
  async function handleAvatarUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      setError("");
      setSuccess("");

      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      // Check file size - maximum 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }

      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const filePath = `${user.id}/${fileName}`;

      // Upload image to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Save URL in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        setError(profileError.message);
        setUploading(false);
        return;
      }

      setAvatarUrl(publicUrl);
      setSuccess("Profile photo uploaded successfully!");

      setUploading(false);

      // Refresh dashboard data
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong while uploading the photo.");
      setUploading(false);
    }
  }

  function toggleSkill(skill: string) {
    setSkills((currentSkills) => {
      if (currentSkills.includes(skill)) {
        return currentSkills.filter(
          (item) => item !== skill
        );
      }

      if (currentSkills.length >= 5) {
        return currentSkills;
      }

      return [...currentSkills, skill];
    });
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanBio = bio.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanUsername) {
      setError("Please choose a username.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError(
        "Username can only contain lowercase letters, numbers and underscores."
      );
      return;
    }

    if (cleanBio.length > 500) {
      setError("Bio must be 500 characters or less.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: cleanName,
          username: cleanUsername,
          bio: cleanBio,
          account_type: accountType,
          skills,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (updateError) {
      if (updateError.code === "23505") {
        setError(
          "That username is already taken. Please choose another one."
        );
      } else {
        setError(updateError.message);
      }

      setSaving(false);
      return;
    }

    setFullName(cleanName);
    setUsername(cleanUsername);
    setBio(cleanBio);

    setSuccess("Profile saved successfully!");

    setSaving(false);

    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 800);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/dashboard"
            className="text-2xl font-extrabold tracking-tight"
          >
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-semibold text-gray-600 hover:text-blue-600"
          >
            ← Back to Dashboard
          </Link>

        </div>
      </nav>

      {/* Page */}
      <section className="px-5 py-10 sm:px-6 md:py-14">

        <div className="mx-auto max-w-4xl">

          {/* Header */}
          <div className="mb-8">

            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Profile Settings
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Complete your profile
            </h1>

            <p className="mt-3 max-w-2xl text-gray-600">
              Tell the YOUTENT community a little about yourself.
              Your profile helps clients and creators know who they
              are working with.
            </p>

          </div>

          <form onSubmit={handleSave}>

            {/* Main Card */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

              {/* Profile Header */}
              <div className="border-b border-gray-200 p-7 sm:p-9">

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                  {/* Avatar */}
                  <div className="relative h-24 w-24 shrink-0">

                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-50"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
                        {fullName
                          ? fullName.charAt(0).toUpperCase()
                          : "C"}
                      </div>
                    )}

                  </div>

                  <div>

                    <h2 className="text-xl font-bold">
                      {fullName || "Your Name"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {email}
                    </p>

                    {/* Upload Button */}
                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                      {uploading
                        ? "Uploading..."
                        : avatarUrl
                        ? "Change Photo"
                        : "Upload Photo"}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>

                    <p className="mt-2 text-xs text-gray-400">
                      JPG, PNG or WEBP. Maximum 5MB.
                    </p>

                  </div>

                </div>

              </div>

              {/* Form Fields */}
              <div className="space-y-7 p-7 sm:p-9">

                {/* Full Name */}
                <div>

                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    maxLength={100}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* Username */}
                <div>

                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Username
                  </label>

                  <div className="flex items-center rounded-xl border border-gray-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-50">

                    <span className="pl-4 text-gray-400">
                      @
                    </span>

                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/\s/g, "")
                        )
                      }
                      placeholder="yourusername"
                      maxLength={30}
                      required
                      className="w-full rounded-xl px-2 py-3 outline-none"
                    />

                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Lowercase letters, numbers and underscores only.
                  </p>

                </div>

                {/* Account Type */}
                <div>

                  <label className="text-sm font-semibold">
                    Account Type
                  </label>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">

                    {/* Client */}
                    <button
                      type="button"
                      onClick={() =>
                        setAccountType("client")
                      }
                      className={`rounded-2xl border p-5 text-left transition ${
                        accountType === "client"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >

                      <div className="text-2xl">
                        👤
                      </div>

                      <p className="mt-3 font-bold">
                        Client
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        I want to hire creative professionals.
                      </p>

                    </button>

                    {/* Freelancer */}
                    <button
                      type="button"
                      onClick={() =>
                        setAccountType("freelancer")
                      }
                      className={`rounded-2xl border p-5 text-left transition ${
                        accountType === "freelancer"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >

                      <div className="text-2xl">
                        🎨
                      </div>

                      <p className="mt-3 font-bold">
                        Freelancer
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        I want to offer my creative services.
                      </p>

                    </button>

                  </div>

                </div>

                {/* Bio */}
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="bio"
                      className="text-sm font-semibold"
                    >
                      Bio
                    </label>

                    <span className="text-xs text-gray-400">
                      {bio.length}/500
                    </span>

                  </div>

                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) =>
                      setBio(e.target.value)
                    }
                    placeholder="Tell clients or creators about yourself..."
                    maxLength={500}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* Skills */}
                <div>

                  <div className="flex items-center justify-between">

                    <label className="text-sm font-semibold">
                      Skills
                    </label>

                    <span className="text-xs text-gray-400">
                      {skills.length}/5 selected
                    </span>

                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Select up to 5 skills.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    {availableSkills.map((skill) => {

                      const selected =
                        skills.includes(skill);

                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            toggleSkill(skill)
                          }
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {skill}
                        </button>
                      );
                    })}

                  </div>

                </div>

                {/* Messages */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">

                <Link
                  href="/dashboard"
                  className="text-center text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save Profile"}
                </button>

              </div>

            </div>

          </form>

        </div>

      </section>

    </main>
  );
}