import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RequestActions from "./RequestActions";

export default async function RequestsPage() {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get project requests sent to this creator
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
    .order("created_at", { ascending: false });

  // Get client IDs
  const clientIds = [
    ...new Set(
      (requests || []).map((request) => request.client_id)
    ),
  ];

  // Client profiles
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

  // Get projects created from these requests
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

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* ================= NAVBAR ================= */}

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/dashboard"
            className="text-2xl font-extrabold tracking-tight"
          >
            Crevo<span className="text-blue-600">.</span>
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

      <section className="mx-auto max-w-5xl px-6 py-12">

        {/* Header */}

        <div className="mb-10">

          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Creator Workspace
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Project Requests
          </h1>

          <p className="mt-3 text-gray-600">
            Manage project requests from clients.
          </p>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Unable to load project requests.
          </div>
        )}

        {/* ================= NO REQUESTS ================= */}

        {!requests || requests.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              📬
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              No project requests yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              When a client sends you a project request,
              it will appear here.
            </p>

            <Link
              href="/creators"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Creators
            </Link>

          </div>

        ) : (

          /* ================= REQUEST LIST ================= */

          <div className="space-y-6">

            {requests.map((request) => {

              const client = clients[request.client_id];

              const projectId = projects[request.id];

              const statusLabel =
                request.status === "pending"
                  ? "Pending"
                  : request.status === "accepted"
                  ? "Accepted"
                  : request.status === "declined"
                  ? "Declined"
                  : request.status === "completed"
                  ? "Completed"
                  : "Cancelled";

              return (

                <div
                  key={request.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >

                  {/* ================= REQUEST HEADER ================= */}

                  <div className="flex flex-col gap-5 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">

                      {/* Client Avatar */}

                      {client?.avatar_url ? (

                        <img
                          src={client.avatar_url}
                          alt={client.full_name || "Client"}
                          className="h-14 w-14 rounded-full object-cover"
                        />

                      ) : (

                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                          {(client?.full_name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                      )}

                      {/* Client Info */}

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Request from
                        </p>

                        <h2 className="mt-1 text-lg font-bold">
                          {client?.full_name || "Client"}
                        </h2>

                        {client?.username && (
                          <p className="text-sm text-gray-500">
                            @{client.username}
                          </p>
                        )}

                      </div>

                    </div>

                    {/* Status */}

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        request.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : request.status === "accepted"
                          ? "bg-green-50 text-green-700"
                          : request.status === "declined"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {statusLabel}
                    </span>

                  </div>

                  {/* ================= REQUEST DETAILS ================= */}

                  <div className="space-y-6 p-6">

                    {/* Project */}

                    <div>

                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Project
                      </p>

                      <h3 className="mt-1 text-2xl font-bold">
                        {request.project_title}
                      </h3>

                    </div>

                    {/* Description */}

                    <div>

                      <p className="text-sm font-semibold text-gray-700">
                        Description
                      </p>

                      <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-600">
                        {request.description}
                      </p>

                    </div>

                    {/* Details */}

                    <div className="grid gap-4 sm:grid-cols-3">

                      {/* Service */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs text-gray-500">
                          Service
                        </p>

                        <p className="mt-1 font-semibold">
                          {request.service || "Not specified"}
                        </p>

                      </div>

                      {/* Budget */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs text-gray-500">
                          Budget
                        </p>

                        <p className="mt-1 font-semibold">
                          {request.budget
                            ? `₹${Number(
                                request.budget
                              ).toLocaleString("en-IN")}`
                            : "Not specified"}
                        </p>

                      </div>

                      {/* Deadline */}

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs text-gray-500">
                          Deadline
                        </p>

                        <p className="mt-1 font-semibold">
                          {request.deadline || "Not specified"}
                        </p>

                      </div>

                    </div>

                    {/* ================= ACTIONS ================= */}

                    {request.status === "pending" && (

                      <div className="border-t border-gray-100 pt-6">

                        <RequestActions
                          requestId={request.id}
                        />

                      </div>

                    )}

                    {/* ================= OPEN PROJECT ================= */}

                    {request.status === "accepted" && projectId && (

                      <div className="border-t border-gray-100 pt-6">

                        <Link
                          href={`/projects/${projectId}`}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                        >
                          Open Project →
                        </Link>

                      </div>

                    )}

                    {/* Accepted but project missing */}

                    {request.status === "accepted" && !projectId && (

                      <div className="border-t border-gray-100 pt-6">

                        <p className="rounded-xl bg-yellow-50 px-5 py-3 text-sm font-medium text-yellow-700">
                          Project workspace is being prepared.
                          Please refresh the page.
                        </p>

                      </div>

                    )}

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </section>

    </main>
  );
}