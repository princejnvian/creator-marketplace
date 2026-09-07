import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RequestActions from "./RequestActions";

export default async function RequestsPage() {
  const supabase = await createClient();

  // ================= AUTH CHECK =================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ================= GET PROJECT REQUESTS =================

  const { data: requests, error } = await supabase
    .from("project_requests")
    .select(`
      id,
      project_title,
      description,
      service,
      budget,
      deadline,
      status,
      created_at,
      client_id
    `)
    .eq("creator_id", user.id)
    .neq("status", "declined")
    .order("created_at", { ascending: false });

  // ================= GET CLIENT IDS =================

  const clientIds = [
    ...new Set(
      (requests || []).map((request) => request.client_id)
    ),
  ];

  // ================= GET CLIENT PROFILES =================

  let clients: Record<
    string,
    {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
    }
  > = {};

  if (clientIds.length > 0) {
    const { data: clientProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", clientIds);

    clients = Object.fromEntries(
      (clientProfiles || []).map((client) => [
        client.id,
        client,
      ])
    );
  }

  // ================= GET PROJECTS =================

  const requestIds = (requests || []).map(
    (request) => request.id
  );

  let projects: Record<string, string> = {};

  if (requestIds.length > 0) {
    const { data: projectData } = await supabase
      .from("projects")
      .select("id, request_id")
      .in("request_id", requestIds);

    projects = Object.fromEntries(
      (projectData || []).map((project) => [
        project.request_id,
        project.id,
      ])
    );
  }

  // ================= STATS =================

  const totalRequests = requests?.length || 0;

  const pendingRequests =
    requests?.filter((request) => request.status === "pending")
      .length || 0;

  const activeRequests =
    requests?.filter((request) => request.status === "accepted")
      .length || 0;

  const completedRequests =
    requests?.filter((request) => request.status === "completed")
      .length || 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ================= NAVBAR ================= */}

      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">

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

          <div className="flex items-center gap-2 sm:gap-3">

            <Link
              href="/dashboard"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition duration-300 hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:px-4"
            >
              <span className="sm:hidden">Profile</span>
              <span className="hidden sm:inline">My Profile</span>
            </Link>

          </div>

        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">

        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -top-20 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">

          <div className="max-w-3xl">

            {/* Badge */}

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
              </span>

              Creator Workspace
            </div>

            {/* Heading */}

            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Project{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Requests.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Review client requirements, manage incoming projects and
              turn your creative skills into completed work.
            </p>

          </div>

        </div>
      </section>

      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

        {/* ================= STATS ================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total */}

          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {totalRequests}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl transition duration-300 group-hover:scale-110">
                📥
              </div>

            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">
              All project requests
            </p>
          </div>

          {/* Pending */}

          <div className="group rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {pendingRequests}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl transition duration-300 group-hover:scale-110">
                ⏳
              </div>

            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">
              Waiting for your response
            </p>
          </div>

          {/* Active */}

          <div className="group rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Active
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {activeRequests}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl transition duration-300 group-hover:scale-110">
                🚀
              </div>

            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">
              Projects currently active
            </p>
          </div>

          {/* Completed */}

          <div className="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {completedRequests}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl transition duration-300 group-hover:scale-110">
                ✓
              </div>

            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">
              Successfully completed
            </p>
          </div>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 font-black">
              !
            </div>

            <div>
              <p className="font-black">
                Unable to load project requests
              </p>

              <p className="mt-1 text-red-600">
                Please refresh the page and try again.
              </p>
            </div>

          </div>
        )}

        {/* ================= EMPTY STATE ================= */}

        {!requests || requests.length === 0 ? (

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:px-10 sm:py-20">

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-3xl" />

            <div className="relative">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 text-4xl shadow-sm ring-1 ring-slate-100">
                📬
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                No project requests yet
              </h2>

              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">
                When clients discover your profile and send you a project
                request, it will appear right here.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Improve My Profile
                  <span className="ml-2">→</span>
                </Link>

                <Link
                  href="/creators"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Browse Creators
                </Link>

              </div>

            </div>

          </div>

        ) : (

          /* ================= REQUEST LIST ================= */

          <div className="space-y-6">

            {requests.map((request) => {

              const client = clients[request.client_id];

              const projectId = projects[request.id];

              const clientName =
                client?.full_name || "Client";

              const initial =
                clientName.charAt(0).toUpperCase();

              const statusConfig =
                request.status === "pending"
                  ? {
                      label: "Pending Review",
                      className:
                        "border-amber-200 bg-amber-50 text-amber-700",
                      dot: "bg-amber-500",
                      icon: "⏳",
                    }
                  : request.status === "accepted"
                  ? {
                      label: "Accepted",
                      className:
                        "border-blue-200 bg-blue-50 text-blue-700",
                      dot: "bg-blue-500",
                      icon: "✓",
                    }
                  : request.status === "declined"
                  ? {
                      label: "Declined",
                      className:
                        "border-red-200 bg-red-50 text-red-700",
                      dot: "bg-red-500",
                      icon: "×",
                    }
                  : request.status === "completed"
                  ? {
                      label: "Completed",
                      className:
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      dot: "bg-emerald-500",
                      icon: "✓",
                    }
                  : {
                      label: "Cancelled",
                      className:
                        "border-slate-200 bg-slate-100 text-slate-600",
                      dot: "bg-slate-400",
                      icon: "—",
                    };

              const formattedDate = request.created_at
                ? new Date(request.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : null;

              return (

                <article
                  key={request.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50"
                >

                  {/* ================= REQUEST TOP ================= */}

                  <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/50 p-5 sm:p-6">

                    <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />

                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* Client */}

                      <div className="flex items-center gap-4">

                        {client?.avatar_url ? (

                          <img
                            src={client.avatar_url}
                            alt={clientName}
                            className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-4 ring-white shadow-md"
                          />

                        ) : (

                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-600/20">
                            {initial}
                          </div>

                        )}

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                              Request from
                            </p>

                            <span className="h-1 w-1 rounded-full bg-slate-300" />

                            {formattedDate && (
                              <p className="text-xs font-medium text-slate-400">
                                {formattedDate}
                              </p>
                            )}

                          </div>

                          <h2 className="mt-1 truncate text-lg font-black text-slate-950 sm:text-xl">
                            {clientName}
                          </h2>

                          {client?.username && (
                            <p className="mt-0.5 truncate text-sm text-slate-500">
                              @{client.username}
                            </p>
                          )}

                        </div>

                      </div>

                      {/* Status */}

                      <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-black ${statusConfig.className}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${statusConfig.dot}`}
                        />

                        <span>
                          {statusConfig.icon}
                        </span>

                        {statusConfig.label}
                      </div>

                    </div>

                  </div>

                  {/* ================= REQUEST BODY ================= */}

                  <div className="p-5 sm:p-6">

                    {/* Project Title */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0">

                        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                          New Project
                        </p>

                        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                          {request.project_title}
                        </h3>

                      </div>

                      {request.service && (
                        <div className="inline-flex w-fit shrink-0 items-center rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-xs font-black text-violet-700">
                          ✦ {request.service}
                        </div>
                      )}

                    </div>

                    {/* Description */}

                    <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">

                      <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                          📝
                        </div>

                        <p className="text-sm font-black text-slate-800">
                          Project Description
                        </p>

                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-[15px]">
                        {request.description ||
                          "No project description provided."}
                      </p>

                    </div>

                    {/* ================= PROJECT DETAILS ================= */}

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">

                      {/* Service */}

                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-base">
                          🎬
                        </div>

                        <p className="mt-3 text-xs font-bold text-slate-400">
                          SERVICE
                        </p>

                        <p className="mt-1 truncate text-sm font-black text-slate-900">
                          {request.service || "Not specified"}
                        </p>

                      </div>

                      {/* Budget */}

                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-base">
                          ₹
                        </div>

                        <p className="mt-3 text-xs font-bold text-slate-400">
                          BUDGET
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-900">
                          {request.budget
                            ? `₹${Number(
                                request.budget
                              ).toLocaleString("en-IN")}`
                            : "Not specified"}
                        </p>

                      </div>

                      {/* Deadline */}

                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-base">
                          📅
                        </div>

                        <p className="mt-3 text-xs font-bold text-slate-400">
                          DEADLINE
                        </p>

                        <p className="mt-1 truncate text-sm font-black text-slate-900">
                          {request.deadline || "Not specified"}
                        </p>

                      </div>

                    </div>

                    {/* ================= ACTION AREA ================= */}

                    {request.status === "pending" && (

                      <div className="mt-7 border-t border-slate-100 pt-6">

                        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Ready to respond?
                            </h4>

                            <p className="mt-1 text-xs text-slate-500">
                              Review the details carefully before accepting.
                            </p>
                          </div>

                          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Action required
                          </span>

                        </div>

                        <RequestActions
                          requestId={request.id}
                        />

                      </div>

                    )}

                    {/* ================= ACCEPTED ================= */}

                    {request.status === "accepted" && projectId && (

                      <div className="mt-7 border-t border-slate-100 pt-6">

                        <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <p className="text-sm font-black text-blue-950">
                              Project accepted successfully
                            </p>

                            <p className="mt-1 text-xs leading-5 text-blue-700">
                              Your workspace is ready. Continue working on
                              this project from the project dashboard.
                            </p>

                          </div>

                          <Link
                            href={`/projects/${projectId}`}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                          >
                            Open Project
                            <span className="ml-2">→</span>
                          </Link>

                        </div>

                      </div>

                    )}

                    {/* ================= PROJECT MISSING ================= */}

                    {request.status === "accepted" && !projectId && (

                      <div className="mt-7 border-t border-slate-100 pt-6">

                        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">

                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 font-black">
                            !
                          </div>

                          <div>
                            <p className="font-black">
                              Project workspace is being prepared
                            </p>

                            <p className="mt-1 text-amber-700">
                              Please refresh the page in a moment.
                            </p>
                          </div>

                        </div>

                      </div>

                    )}

                    {/* ================= DECLINED ================= */}

                    {request.status === "declined" && (

                      <div className="mt-7 border-t border-slate-100 pt-6">

                        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">

                          <p className="text-sm font-black text-red-800">
                            This request was declined
                          </p>

                          <p className="mt-1 text-xs leading-5 text-red-600">
                            No further action is required for this project
                            request.
                          </p>

                        </div>

                      </div>

                    )}

                    {/* ================= COMPLETED ================= */}

                    {request.status === "completed" && projectId && (

                      <div className="mt-7 border-t border-slate-100 pt-6">

                        <Link
                          href={`/projects/${projectId}`}
                          className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 transition hover:bg-emerald-50"
                        >

                          <div>

                            <p className="text-sm font-black text-emerald-800">
                              Project completed successfully
                            </p>

                            <p className="mt-1 text-xs text-emerald-600">
                              View the project details and delivery history.
                            </p>

                          </div>

                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-emerald-700 shadow-sm">
                            →
                          </span>

                        </Link>

                      </div>

                    )}

                  </div>

                </article>

              );
            })}

          </div>

        )}

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="mt-6 border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

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