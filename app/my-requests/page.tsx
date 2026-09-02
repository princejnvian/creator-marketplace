import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyRequestsPage() {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get requests created by this client
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
      creator_id
    `)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  // Get creator IDs
  const creatorIds = [
    ...new Set(
      (requests || []).map((request) => request.creator_id)
    ),
  ];

  // Creator profiles
  let creators: Record<
    string,
    {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
    }
  > = {};

  if (creatorIds.length > 0) {
    const { data: creatorProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", creatorIds);

    creators = Object.fromEntries(
      (creatorProfiles || []).map((creator) => [
        creator.id,
        creator,
      ])
    );
  }

  // Get projects created from accepted requests
  const requestIds = (requests || []).map(
    (request) => request.id
  );

  let projects: Record<
    string,
    {
      id: string;
      request_id: string;
    }
  > = {};

  if (requestIds.length > 0) {
    const { data: projectData } = await supabase
      .from("projects")
      .select("id, request_id")
      .in("request_id", requestIds);

    projects = Object.fromEntries(
      (projectData || []).map((project) => [
        project.request_id,
        project,
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
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <Link
              href="/creators"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Browse Creators
            </Link>

          </div>

        </div>

      </nav>

      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-5xl px-6 py-12">

        {/* Header */}

        <div className="mb-10">

          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Client Workspace
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            My Project Requests
          </h1>

          <p className="mt-3 text-gray-600">
            Track the project requests you have sent to creators.
          </p>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Unable to load your project requests.
          </div>
        )}

        {/* ================= NO REQUESTS ================= */}

        {!requests || requests.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              📋
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              No project requests yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              When you hire a creator, your project requests
              will appear here.
            </p>

            <Link
              href="/creators"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Browse Creators
            </Link>

          </div>

        ) : (

          /* ================= REQUEST LIST ================= */

          <div className="space-y-6">

            {requests.map((request) => {

              const creator = creators[request.creator_id];

              const project = projects[request.id];

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

                  {/* ================= HEADER ================= */}

                  <div className="flex flex-col gap-5 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">

                      {/* Creator Avatar */}

                      {creator?.avatar_url ? (

                        <img
                          src={creator.avatar_url}
                          alt={creator.full_name || "Creator"}
                          className="h-14 w-14 rounded-full object-cover"
                        />

                      ) : (

                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                          {(creator?.full_name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                      )}

                      {/* Creator Info */}

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Creator
                        </p>

                        <h2 className="mt-1 text-lg font-bold">
                          {creator?.full_name || "Creator"}
                        </h2>

                        {creator?.username && (
                          <p className="text-sm text-gray-500">
                            @{creator.username}
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

                  {/* ================= DETAILS ================= */}

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

                    {/* ================= ACCEPTED PROJECT ================= */}

                    {request.status === "accepted" && (

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <p className="font-bold text-green-800">
                              🎉 Your request has been accepted!
                            </p>

                            <p className="mt-1 text-sm text-green-700">
                              Your project workspace is ready.
                            </p>

                          </div>

                          {project ? (

                            <Link
                              href={`/projects/${project.id}`}
                              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                            >
                              Open Project →
                            </Link>

                          ) : (

                            <span className="text-sm font-semibold text-yellow-700">
                              Creating project...
                            </span>

                          )}

                        </div>

                      </div>

                    )}

                    {/* ================= DECLINED ================= */}

                    {request.status === "declined" && (

                      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                        <p className="font-semibold text-red-700">
                          This request was declined by the creator.
                        </p>

                      </div>

                    )}

                    {/* ================= CREATOR PROFILE ================= */}

                    {creator?.username && (

                      <div className="border-t border-gray-100 pt-5">

                        <Link
                          href={`/creators/${creator.username}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View Creator Profile →
                        </Link>

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