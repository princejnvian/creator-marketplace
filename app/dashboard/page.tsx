import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, username, bio, avatar_url, account_type, skills"
    )
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    "User";

  const username = profile?.username || "";

  const accountType =
    profile?.account_type ||
    user.user_metadata?.account_type ||
    "client";

  const displayAccountType =
    accountType === "freelancer"
      ? "Freelancer"
      : "Client";

  const skills: string[] = profile?.skills || [];

  const isFreelancer = accountType === "freelancer";

  // ================= PROJECTS =================
  // Get projects where current user is either
  // the client or freelancer.

  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      budget,
      deadline,
      status,
      created_at,
      client_id,
      freelancer_id
      `
    )
    .or(
      `client_id.eq.${user.id},freelancer_id.eq.${user.id}`
    )
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* ================= NAVBAR ================= */}

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* Logo */}

          <Link
            href="/dashboard"
            className="text-2xl font-extrabold tracking-tight"
          >
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          {/* Navigation */}

          <div className="flex items-center gap-2 sm:gap-3">

            <Link
              href={
                isFreelancer
                  ? "/requests"
                  : "/my-requests"
              }
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              {isFreelancer
                ? "Project Requests"
                : "My Requests"}
            </Link>

            <Link
              href="/profile"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              My Profile
            </Link>

            <form
              action="/auth/signout"
              method="post"
            >
              <button
                type="submit"
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Log out
              </button>
            </form>

          </div>

        </div>
      </nav>

      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-7xl px-6 py-12">

        {/* Welcome */}

        <div className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Welcome, {fullName} 👋
          </h1>

          <p className="mt-3 text-gray-600">
            Manage your YOUTENT account and discover new opportunities.
          </p>

        </div>

        {/* ================= ACCOUNT CARDS ================= */}

        <div className="grid gap-6 md:grid-cols-3">

          {/* Account Type */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Account Type
            </p>

            <p className="mt-2 text-2xl font-bold">
              {displayAccountType}
            </p>

          </div>

          {/* Email */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Email
            </p>

            <p className="mt-2 break-all text-lg font-semibold">
              {user.email}
            </p>

          </div>

          {/* Status */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Account Status
            </p>

            <div className="mt-2 flex items-center gap-2">

              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

              <p className="text-lg font-bold text-green-600">
                Active
              </p>

            </div>

          </div>

        </div>

        {/* ================= MY PROJECTS ================= */}

        <div className="mt-10">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Workspace
              </p>

              <h2 className="mt-1 text-2xl font-extrabold">
                My Projects
              </h2>

              <p className="mt-1 text-gray-600">
                {isFreelancer
                  ? "Projects you are working on with clients."
                  : "Projects you have started with creators."}
              </p>

            </div>

          </div>

          {!projects || projects.length === 0 ? (

            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                📁
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No projects yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                {isFreelancer
                  ? "Accepted projects will appear here."
                  : "Once a creator accepts your request, your project will appear here."}
              </p>

              {!isFreelancer && (
                <Link
                  href="/creators"
                  className="mt-5 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Browse Creators
                </Link>
              )}

            </div>

          ) : (

            <div className="grid gap-5 lg:grid-cols-2">

              {projects.map((project) => {

                const statusLabel =
                  project.status === "active"
                    ? "Active"
                    : project.status === "completed"
                    ? "Completed"
                    : project.status === "cancelled"
                    ? "Cancelled"
                    : project.status;

                return (

                  <div
                    key={project.id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >

                    {/* Project Header */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          Project
                        </p>

                        <h3 className="mt-1 truncate text-xl font-bold">
                          {project.title}
                        </h3>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          project.status === "active"
                            ? "bg-green-100 text-green-700"
                            : project.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : project.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabel}
                      </span>

                    </div>

                    {/* Description */}

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
                      {project.description}
                    </p>

                    {/* Details */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs text-gray-500">
                          Budget
                        </p>

                        <p className="mt-1 font-bold">
                          {project.budget !== null
                            ? `₹${Number(
                                project.budget
                              ).toLocaleString("en-IN")}`
                            : "Not specified"}
                        </p>

                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs text-gray-500">
                          Deadline
                        </p>

                        <p className="mt-1 font-bold">
                          {project.deadline
                            ? new Date(
                                project.deadline
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Not specified"}
                        </p>

                      </div>

                    </div>

                    {/* Open Project */}

                    <div className="mt-5 border-t border-gray-100 pt-5">

                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                      >
                        Open Project →
                      </Link>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </div>

        {/* ================= PROFILE CARD ================= */}

        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-8 md:flex-row">

            {/* Avatar */}

            {profile?.avatar_url ? (

              <img
                src={profile.avatar_url}
                alt={fullName}
                className="h-24 w-24 shrink-0 rounded-full object-cover"
              />

            ) : (

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
                {fullName.charAt(0).toUpperCase()}
              </div>

            )}

            {/* Profile Information */}

            <div className="min-w-0 flex-1">

              <div className="flex flex-col justify-between gap-4 sm:flex-row">

                <div>

                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Your Profile
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {fullName}
                  </h2>

                  {username && (
                    <p className="mt-1 text-sm text-gray-500">
                      @{username}
                    </p>
                  )}

                </div>

                <Link
                  href="/profile"
                  className="inline-flex h-fit items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Edit Profile
                </Link>

              </div>

              {/* Bio */}

              <div className="mt-5">

                <p className="text-sm font-semibold text-gray-700">
                  About
                </p>

                <p className="mt-2 leading-7 text-gray-600">
                  {profile?.bio ||
                    "You haven't added a bio yet. Tell the YOUTENT community about yourself."}
                </p>

              </div>

              {/* Skills */}

              <div className="mt-5">

                <p className="text-sm font-semibold text-gray-700">
                  Skills
                </p>

                {skills.length > 0 ? (

                  <div className="mt-3 flex flex-wrap gap-2">

                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-gray-500">
                    No skills added yet.
                  </p>

                )}

              </div>

            </div>

          </div>

        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <div className="mt-8 grid gap-6 md:grid-cols-3">

          {/* Requests */}

          <Link
            href={
              isFreelancer
                ? "/requests"
                : "/my-requests"
            }
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              {isFreelancer ? "📬" : "📋"}
            </div>

            <h3 className="mt-5 text-lg font-bold">
              {isFreelancer
                ? "Project Requests"
                : "My Requests"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {isFreelancer
                ? "View and manage project requests from clients."
                : "Track the project requests you have sent to creators."}
            </p>

            <p className="mt-4 text-sm font-semibold text-blue-600">
              {isFreelancer
                ? "View Requests →"
                : "View My Requests →"}
            </p>

          </Link>

          {/* Browse Creators */}

          <Link
            href="/creators"
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              🔍
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Browse Creators
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Discover talented creators and creative services.
            </p>

            <p className="mt-4 text-sm font-semibold text-blue-600">
              Find Creators →
            </p>

          </Link>

          {/* Messages */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              💬
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Messages
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Connect and communicate with clients and creators.
            </p>

            <p className="mt-4 text-sm font-semibold text-gray-400">
              Coming soon
            </p>

          </div>

        </div>

        {/* ================= GETTING STARTED ================= */}

        {!profile?.full_name && (

          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-8">

            <h2 className="text-2xl font-bold">
              Complete your profile
            </h2>

            <p className="mt-2 max-w-2xl text-gray-600">
              Add your name, username, bio and skills to make your
              YOUTENT profile ready.
            </p>

            <Link
              href="/profile"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Complete Profile
            </Link>

          </div>

        )}

      </section>

    </main>
  );
}