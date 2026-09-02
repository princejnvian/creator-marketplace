import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CreatorsPage() {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all freelancers
  const { data: creators, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, bio, avatar_url, account_type, skills"
    )
    .eq("account_type", "freelancer")
    .order("created_at", { ascending: false });

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
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              My Profile
            </Link>

          </div>

        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        {/* Header */}
        <div className="mb-10">

          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            YOUTENT Marketplace
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Browse Creators
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Discover talented freelancers and find the right creator
            for your next project.
          </p>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Unable to load creators right now.
          </div>
        )}

        {/* ================= CREATOR GRID ================= */}

        {creators && creators.length > 0 ? (

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {creators.map((creator) => {

              const fullName =
                creator.full_name || "Creator";

              const skills: string[] =
                creator.skills || [];

              return (

                <div
                  key={creator.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* Card Top */}
                  <div className="p-6">

                    <div className="flex items-center gap-4">

                      {/* Avatar */}
                      {creator.avatar_url ? (

                        <img
                          src={creator.avatar_url}
                          alt={fullName}
                          className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-blue-50"
                        />

                      ) : (

                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                          {fullName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                      )}

                      {/* Name */}
                      <div className="min-w-0">

                        <h2 className="truncate text-xl font-bold">
                          {fullName}
                        </h2>

                        {creator.username && (
                          <p className="mt-1 truncate text-sm text-gray-500">
                            @{creator.username}
                          </p>
                        )}

                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Freelancer
                        </div>

                      </div>

                    </div>

                    {/* Bio */}
                    <div className="mt-6">

                      <p className="text-sm leading-6 text-gray-600">
                        {creator.bio ||
                          "This creator hasn't added a bio yet."}
                      </p>

                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (

                      <div className="mt-5">

                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                          Skills
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {skills.map((skill) => (

                            <span
                              key={skill}
                              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                            >
                              {skill}
                            </span>

                          ))}

                        </div>

                      </div>

                    )}

                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-gray-100 bg-gray-50 p-4">

                    <Link
                      href={`/creators/${creator.username || creator.id}`}
                      className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      View Profile →
                    </Link>

                  </div>

                </div>

              );

            })}

          </div>

        ) : (

          /* No creators */
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              🎨
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              No creators yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              There are no freelancers available yet.
              Become one and offer your creative services on YOUTENT.
            </p>

            <Link
              href="/profile"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Become a Freelancer
            </Link>

          </div>

        )}

      </section>

    </main>
  );
}