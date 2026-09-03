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
    accountType === "freelancer" ? "Freelancer" : "Client";

  const skills: string[] = profile?.skills || [];

  const isFreelancer = accountType === "freelancer";

  // ================= PROJECTS =================

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
    .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const projectCount = projects?.length || 0;
  const activeProjects =
    projects?.filter((project) => project.status === "active").length || 0;
  const completedProjects =
    projects?.filter((project) => project.status === "completed").length || 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ================= NAVBAR ================= */}

      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">

          {/* Logo */}

          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition duration-300 group-hover:scale-105 group-hover:rotate-1">
              Y
            </div>

            <div className="text-xl font-black tracking-tight sm:text-2xl">
              YOUTENT<span className="text-blue-600">.</span>
            </div>
          </Link>

          {/* Navigation */}

          <div className="flex items-center gap-1 sm:gap-2">

            <Link
              href={isFreelancer ? "/requests" : "/my-requests"}
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              {isFreelancer ? "Project Requests" : "My Requests"}
            </Link>

            <Link
              href="/profile"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-4"
            >
              My Profile
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:px-4"
              >
                Log out
              </button>
            </form>

          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">

        {/* Decorative background */}

        <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Dashboard
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                {fullName}
              </span>{" "}
              👋
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Manage your YOUTENT account, track your projects and connect
              with talented creators.
            </p>

          </div>

        </div>
      </section>

      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12">

        {/* ================= OVERVIEW ================= */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Account */}

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                {isFreelancer ? "🎨" : "💼"}
              </div>

              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                ACTIVE
              </span>

            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              Account Type
            </p>

            <p className="mt-1 text-xl font-black text-slate-900">
              {displayAccountType}
            </p>

          </div>

          {/* Projects */}

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">
              📁
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              Total Projects
            </p>

            <p className="mt-1 text-2xl font-black text-slate-900">
              {projectCount}
            </p>

          </div>

          {/* Active */}

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
              ⚡
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              Active Projects
            </p>

            <p className="mt-1 text-2xl font-black text-slate-900">
              {activeProjects}
            </p>

          </div>

          {/* Completed */}

          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl">
              ✓
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              Completed
            </p>

            <p className="mt-1 text-2xl font-black text-slate-900">
              {completedProjects}
            </p>

          </div>

        </div>

        {/* ================= PROJECTS ================= */}

        <div className="mt-12">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                Workspace
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                My Projects
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isFreelancer
                  ? "Projects you are currently working on with clients."
                  : "Projects you have started with creators."}
              </p>
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              {projectCount} {projectCount === 1 ? "project" : "projects"}
            </div>

          </div>

          {!projects || projects.length === 0 ? (

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">

              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />

              <div className="relative">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-3xl shadow-sm">
                  📁
                </div>

                <h3 className="mt-5 text-2xl font-black text-slate-900">
                  No projects yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {isFreelancer
                    ? "Accepted projects will appear here when clients hire you."
                    : "Once a creator accepts your request, your project will appear here."}
                </p>

                {!isFreelancer && (
                  <Link
                    href="/creators"
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
                  >
                    Browse Creators →
                  </Link>
                )}

              </div>

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

                const statusClass =
                  project.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : project.status === "completed"
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : project.status === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-slate-50 text-slate-600 border-slate-200";

                return (

                  <div
                    key={project.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
                  >

                    {/* Top accent */}

                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 opacity-0 transition duration-300 group-hover:opacity-100" />

                    {/* Header */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Project
                          </span>

                          {project.status === "active" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>

                        <h3 className="mt-1 truncate text-xl font-black text-slate-900">
                          {project.title}
                        </h3>

                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>

                    </div>

                    {/* Description */}

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                      {project.description}
                    </p>

                    {/* Details */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition group-hover:bg-blue-50/50">

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <span>💰</span>
                          Budget
                        </div>

                        <p className="mt-1.5 font-black text-slate-900">
                          {project.budget !== null
                            ? `₹${Number(
                                project.budget
                              ).toLocaleString("en-IN")}`
                            : "Not specified"}
                        </p>

                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition group-hover:bg-indigo-50/50">

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <span>📅</span>
                          Deadline
                        </div>

                        <p className="mt-1.5 font-black text-slate-900">
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

                    {/* Button */}

                    <div className="mt-5 border-t border-slate-100 pt-5">

                      <Link
                        href={`/projects/${project.id}`}
                        className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition duration-300 hover:bg-blue-600"
                      >
                        Open Project
                        <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </Link>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

        {/* ================= PROFILE ================= */}

        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 sm:h-28" />

          <div className="px-6 pb-7 sm:px-8">

            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex items-end gap-4">

                {/* Avatar */}

                {profile?.avatar_url ? (

                  <img
                    src={profile.avatar_url}
                    alt={fullName}
                    className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg sm:h-28 sm:w-28"
                  />

                ) : (

                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-100 to-indigo-100 text-4xl font-black text-blue-600 shadow-lg sm:h-28 sm:w-28">
                    {fullName.charAt(0).toUpperCase()}
                  </div>

                )}

                <div className="pb-1">

                  <div className="flex items-center gap-2">

                    <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                      {fullName}
                    </h2>

                    <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 sm:inline">
                      {displayAccountType}
                    </span>

                  </div>

                  {username && (
                    <p className="mt-1 text-sm text-slate-500">
                      @{username}
                    </p>
                  )}

                </div>

              </div>

              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition duration-300 hover:bg-blue-600"
              >
                Edit Profile
                <span className="ml-2">→</span>
              </Link>

            </div>

            {/* Profile body */}

            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                  About
                </p>

                <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                  {profile?.bio ||
                    "You haven't added a bio yet. Tell the YOUTENT community about yourself."}
                </p>

                <div className="mt-7">

                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Skills & Expertise
                  </p>

                  {skills.length > 0 ? (

                    <div className="mt-3 flex flex-wrap gap-2">

                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-blue-700"
                        >
                          {skill}
                        </span>
                      ))}

                    </div>

                  ) : (

                    <p className="mt-3 text-sm text-slate-500">
                      No skills added yet.
                    </p>

                  )}

                </div>

              </div>

              {/* Profile status */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />

                  <span className="text-sm font-bold text-emerald-700">
                    Account Active
                  </span>

                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Your YOUTENT account is active and ready to use.
                </p>

                <div className="mt-5 border-t border-slate-200 pt-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {user.email}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <div className="mt-12">

          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Shortcuts
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Quick Actions
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {/* Requests */}

            <Link
              href={isFreelancer ? "/requests" : "/my-requests"}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
            >

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl transition duration-300 group-hover:scale-110">
                  {isFreelancer ? "📬" : "📋"}
                </div>

                <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
                  →
                </span>

              </div>

              <h3 className="mt-5 text-lg font-black">
                {isFreelancer
                  ? "Project Requests"
                  : "My Requests"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isFreelancer
                  ? "View and manage project requests from clients."
                  : "Track the project requests you have sent to creators."}
              </p>

            </Link>

            {/* Creators */}

            <Link
              href="/creators"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40"
            >

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl transition duration-300 group-hover:scale-110">
                  🔍
                </div>

                <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600">
                  →
                </span>

              </div>

              <h3 className="mt-5 text-lg font-black">
                Browse Creators
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Discover talented creators and creative services.
              </p>

            </Link>

            {/* Messages */}

            <Link
              href="/dashboard"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40"
            >

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-xl transition duration-300 group-hover:scale-110">
                  💬
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Soon
                </span>

              </div>

              <h3 className="mt-5 text-lg font-black">
                Messages
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Connect and communicate with clients and creators.
              </p>

            </Link>

          </div>

        </div>

        {/* ================= GETTING STARTED ================= */}

        {!profile?.full_name && (

          <div className="relative mt-10 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-8 sm:p-10">

            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />

            <div className="relative">

              <div className="inline-flex rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-xs font-bold text-blue-700">
                Almost there
              </div>

              <h2 className="mt-4 text-2xl font-black text-slate-950">
                Complete your profile
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Add your name, username, bio and skills to make your
                YOUTENT profile ready and help others know what you do.
              </p>

              <Link
                href="/profile"
                className="mt-6 inline-flex items-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition duration-300 hover:bg-blue-600"
              >
                Complete Profile
                <span className="ml-2">→</span>
              </Link>

            </div>

          </div>

        )}

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <p>
            © {new Date().getFullYear()} YOUTENT. All rights reserved.
          </p>

          <p className="font-medium">
            Where Talent Meets Opportunity
          </p>

        </div>

      </footer>

    </main>
  );
}