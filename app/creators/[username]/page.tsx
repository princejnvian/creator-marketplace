import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HireForm from "./HireForm";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function CreatorProfilePage({
  params,
}: Props) {
  const supabase = await createClient();

  const { username } = await params;

  const cleanUsername = username.toLowerCase();

  // Find creator
  const { data: creator, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, bio, avatar_url, account_type, skills"
    )
    .eq("username", cleanUsername)
    .eq("account_type", "freelancer")
    .maybeSingle();

  if (error || !creator) {
    notFound();
  }

  const fullName = creator.full_name || "Creator";
  const skills: string[] = creator.skills || [];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* ================= NAVBAR ================= */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/dashboard"
            className="text-2xl font-extrabold tracking-tight"
          >
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/creators"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Browse Creators
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Dashboard
            </Link>

          </div>

        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <section className="mx-auto max-w-5xl px-6 py-12">

        {/* Back */}
        <Link
          href="/creators"
          className="inline-flex items-center text-sm font-semibold text-gray-600 transition hover:text-blue-600"
        >
          ← Back to Creators
        </Link>

        {/* ================= PROFILE CARD ================= */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* Top Section */}
          <div className="border-b border-gray-200 bg-gradient-to-br from-blue-50 to-white px-7 py-10 sm:px-10">

            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">

              {/* Avatar */}
              {creator.avatar_url ? (

                <img
                  src={creator.avatar_url}
                  alt={fullName}
                  className="h-32 w-32 shrink-0 rounded-full object-cover ring-8 ring-white shadow-md"
                />

              ) : (

                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-blue-100 text-5xl font-bold text-blue-600 ring-8 ring-white shadow-md">
                  {fullName.charAt(0).toUpperCase()}
                </div>

              )}

              {/* Name */}
              <div className="min-w-0 flex-1">

                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Freelancer
                </div>

                <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {fullName}
                </h1>

                {creator.username && (
                  <p className="mt-1 text-gray-500">
                    @{creator.username}
                  </p>
                )}

              </div>

              {/* Hire Button */}
             <HireForm
  creatorId={creator.id}
  creatorName={fullName}
/>

            </div>

          </div>

          {/* Details */}
          <div className="p-7 sm:p-10">

            {/* About */}
            <div>

              <h2 className="text-xl font-bold">
                About
              </h2>

              <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-7 text-gray-600">
                {creator.bio ||
                  "This creator hasn't added a bio yet."}
              </p>

            </div>

            {/* Skills */}
            <div className="mt-10">

              <h2 className="text-xl font-bold">
                Skills
              </h2>

              {skills.length > 0 ? (

                <div className="mt-4 flex flex-wrap gap-2">

                  {skills.map((skill) => (

                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                    >
                      {skill}
                    </span>

                  ))}

                </div>

              ) : (

                <p className="mt-3 text-gray-500">
                  No skills added yet.
                </p>

              )}

            </div>

            {/* Coming Soon */}
            <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6">

              <p className="text-sm font-bold text-gray-700">
                More creator features coming soon
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Portfolio, reviews, pricing, messaging and project
                requests will be available here.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}