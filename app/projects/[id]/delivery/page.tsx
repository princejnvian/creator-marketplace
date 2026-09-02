import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DeliveryPage({ params }: Props) {
  const supabase = await createClient();

  // =========================
  // AUTH
  // =========================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  // =========================
  // GET PROJECT
  // =========================

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      id,
      client_id,
      freelancer_id,
      title,
      description,
      budget,
      deadline,
      status
    `)
    .eq("id", id)
    .maybeSingle();

  if (projectError || !project) {
    notFound();
  }

  // =========================
  // ACCESS CHECK
  // =========================

  if (
    project.client_id !== user.id &&
    project.freelancer_id !== user.id
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="text-2xl font-bold text-gray-900">
            Access Denied
          </h1>

          <p className="mt-3 text-gray-600">
            You are not allowed to access this project.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>

        </div>
      </main>
    );
  }

  const isClient = project.client_id === user.id;
  const isFreelancer = project.freelancer_id === user.id;

  // =========================
  // GET LATEST DELIVERY
  // =========================

  const {
    data: latestDelivery,
    error: deliveryError,
  } = await supabase
    .from("project_deliveries")
    .select(`
      id,
      project_id,
      freelancer_id,
      client_id,
      message,
      file_path,
      file_name,
      status,
      created_at,
      updated_at
    `)
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // =========================
  // GET PROJECT FILES
  // =========================

  const {
    data: projectFiles,
    error: projectFilesError,
  } = await supabase.storage
    .from("project-files")
    .list(project.id, {
      limit: 100,
      sortBy: {
        column: "created_at",
        order: "desc",
      },
    });

  // =========================
  // CREATE SIGNED URL
  // FOR DELIVERY FILE
  // =========================

  let deliveryFileUrl: string | null = null;

  if (latestDelivery?.file_path) {
    const { data: signedUrlData } = await supabase.storage
      .from("project-files")
      .createSignedUrl(
        latestDelivery.file_path,
        60 * 60
      );

    deliveryFileUrl = signedUrlData?.signedUrl || null;
  }

  // =========================
  // STATUS HELPERS
  // =========================

  const hasDelivery = !!latestDelivery;

  const deliveryStatus = latestDelivery?.status || null;

  const isSubmitted =
    deliveryStatus === "submitted";

  const isRevisionRequested =
    deliveryStatus === "revision_requested";

  const isApproved =
    deliveryStatus === "approved";

  // =========================
  // PAGE
  // =========================

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/dashboard"
            className="text-2xl font-extrabold tracking-tight"
          >
            Crevo<span className="text-blue-600">.</span>
          </Link>

          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-semibold text-gray-600 transition hover:text-blue-600"
          >
            ← Back to Project
          </Link>

        </div>
      </nav>

      {/* =========================
          MAIN
      ========================= */}

      <section className="mx-auto max-w-4xl px-6 py-12">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Project Delivery
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Delivery Workspace
          </h1>

          <p className="mt-3 text-gray-600">
            {isFreelancer
              ? "Submit your completed work to the client."
              : "Review the work submitted by your freelancer."}
          </p>

        </div>

        {/* =========================
            PROJECT CARD
        ========================= */}

        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

          <p className="text-sm font-semibold text-gray-500">
            Project
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {project.title}
          </h2>

          {project.description && (
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-600">
              {project.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Project Status: {project.status}
            </span>

            {project.budget !== null && (
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                Budget: ₹{project.budget}
              </span>
            )}

          </div>

        </div>


        {/* =========================================================
            FREELANCER VIEW
        ========================================================= */}

        {isFreelancer && (
          <div className="space-y-6">

            {/* =========================
                CURRENT DELIVERY STATUS
            ========================= */}

            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  🚀
                </div>

                <div>

                  <p className="text-sm font-semibold text-gray-500">
                    Delivery Status
                  </p>

                  <h2 className="mt-1 text-xl font-bold">

                    {!hasDelivery &&
                      "Ready for Delivery"}

                    {isSubmitted &&
                      "Waiting for Client Review"}

                    {isRevisionRequested &&
                      "Revision Requested"}

                    {isApproved &&
                      "Delivery Approved"}

                  </h2>

                </div>

              </div>


              {/* STATUS MESSAGE */}

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">

                {!hasDelivery && (
                  <p className="text-sm leading-6 text-gray-700">
                    Your work is ready. Select your final project file
                    and submit it to the client.
                  </p>
                )}

                {isSubmitted && (
                  <p className="text-sm leading-6 text-gray-700">
                    Your delivery has been submitted successfully.
                    Please wait for the client to review it.
                  </p>
                )}

                {isRevisionRequested && (
                  <p className="text-sm leading-6 text-gray-700">
                    The client has requested a revision. Review their
                    feedback and submit the updated work.
                  </p>
                )}

                {isApproved && (
                  <p className="text-sm leading-6 text-gray-700">
                    The client has approved your delivery. This project
                    is now completed.
                  </p>
                )}

              </div>

            </div>


            {/* =========================
                PREVIOUS DELIVERY
            ========================= */}

            {latestDelivery && (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Latest Delivery
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Submitted Work
                </h2>

                {/* MESSAGE */}

                <div className="mt-6">

                  <p className="text-sm font-semibold text-gray-500">
                    Delivery Message
                  </p>

                  <div className="mt-2 rounded-2xl bg-gray-50 p-5">

                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {latestDelivery.message}
                    </p>

                  </div>

                </div>


                {/* FILE */}

                {latestDelivery.file_path && (
                  <div className="mt-6">

                    <p className="text-sm font-semibold text-gray-500">
                      Final File
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                          📄
                        </div>

                        <p className="truncate text-sm font-bold">
                          {latestDelivery.file_name ||
                            latestDelivery.file_path.split("/").pop()}
                        </p>

                      </div>

                      {deliveryFileUrl && (
                        <a
                          href={deliveryFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Open
                        </a>
                      )}

                    </div>

                  </div>
                )}

              </div>
            )}


            {/* =========================
                SUBMIT / RESUBMIT
            ========================= */}

            {project.status === "active" &&
              (!latestDelivery ||
                isRevisionRequested) && (

              <form
                action={async (formData) => {
                  "use server";

                  const message =
                    formData
                      .get("message")
                      ?.toString() || "";

                  const filePath =
                    formData
                      .get("file_path")
                      ?.toString() || "";

                  const fileName =
                    filePath.split("/").pop() || "";

                  const supabase =
                    await createClient();

                  const {
                    data: { user },
                  } =
                    await supabase.auth.getUser();

                  if (!user) {
                    redirect("/login");
                  }

                  if (!message.trim()) {
                    return;
                  }

                  // Verify project
                  const { data: projectCheck } =
                    await supabase
                      .from("projects")
                      .select(`
                        id,
                        client_id,
                        freelancer_id,
                        status
                      `)
                      .eq("id", project.id)
                      .maybeSingle();

                  if (!projectCheck) {
                    notFound();
                  }

                  // Only freelancer
                  if (
                    projectCheck.freelancer_id !==
                    user.id
                  ) {
                    return;
                  }

                  // Project must be active
                  if (
                    projectCheck.status !== "active"
                  ) {
                    return;
                  }

                  // File is required
                  if (!filePath) {
                    return;
                  }

                  // Insert new delivery
                  const { error } =
                    await supabase
                      .from("project_deliveries")
                      .insert({
                        project_id:
                          projectCheck.id,

                        freelancer_id:
                          user.id,

                        client_id:
                          projectCheck.client_id,

                        message:
                          message.trim(),

                        file_path:
                          filePath,

                        file_name:
                          fileName,

                        status:
                          "submitted",
                      });

                  if (error) {
                    console.error(
                      "Delivery insert error:",
                      error
                    );

                    return;
                  }

                  redirect(
                    `/projects/${project.id}/delivery`
                  );
                }}
                className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
              >

                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  {isRevisionRequested
                    ? "Submit Revision"
                    : "Submit Work"}
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {isRevisionRequested
                    ? "Updated Delivery"
                    : "Final Delivery"}
                </h2>

                <p className="mt-2 text-gray-600">
                  {isRevisionRequested
                    ? "Upload or select your revised work and send it to the client."
                    : "Select your completed project file and send it to the client."}
                </p>


                {/* MESSAGE */}

                <div className="mt-6">

                  <label
                    htmlFor="message"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Delivery Message
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    placeholder={
                      isRevisionRequested
                        ? "Explain what you changed in this revision..."
                        : "Write a message for the client..."
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>


                {/* PROJECT FILES */}

                <div className="mt-6">

                  <label className="text-sm font-semibold text-gray-700">
                    Select Final File
                  </label>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a file that you have already uploaded to
                    this project.
                  </p>


                  {projectFilesError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      Unable to load project files.
                    </div>
                  )}


                  {!projectFilesError &&
                    (!projectFiles ||
                      projectFiles.length === 0) && (

                    <div className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

                      <p className="font-semibold text-yellow-800">
                        No project files available
                      </p>

                      <p className="mt-1 text-sm text-yellow-700">
                        Upload your final file from the Project Files
                        section first.
                      </p>

                      <Link
                        href={`/projects/${project.id}/files`}
                        className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Go to Project Files →
                      </Link>

                    </div>
                  )}


                  {projectFiles &&
                    projectFiles.length > 0 && (

                    <div className="mt-3 space-y-3">

                      {projectFiles.map((file) => {

                        const filePath =
                          `${project.id}/${file.name}`;

                        return (
                          <label
                            key={file.name}
                            className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-400 hover:bg-blue-50"
                          >

                            <input
                              type="radio"
                              name="file_path"
                              value={filePath}
                              required
                              className="h-4 w-4"
                            />

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                              📄
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-bold text-gray-900">
                                {file.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Project file
                              </p>

                            </div>

                          </label>
                        );
                      })}

                    </div>
                  )}

                </div>


                {/* BUTTON */}

                <button
                  type="submit"
                  disabled={
                    !projectFiles ||
                    projectFiles.length === 0
                  }
                  className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRevisionRequested
                    ? "Submit Revision →"
                    : "Submit Delivery →"}
                </button>

                <p className="mt-3 text-center text-xs text-gray-500">
                  The selected file will be shared securely with the
                  client.
                </p>

              </form>
            )}

          </div>
        )}


        {/* =========================================================
            CLIENT VIEW
        ========================================================= */}

        {isClient && (
          <div className="space-y-6">

            {/* =========================
                STATUS
            ========================= */}

            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-2xl">
                  {isApproved
                    ? "✅"
                    : isSubmitted
                    ? "📦"
                    : isRevisionRequested
                    ? "🔄"
                    : "⏳"}
                </div>

                <div>

                  <p className="text-sm font-semibold text-gray-500">
                    Delivery Status
                  </p>

                  <h2 className="mt-1 text-xl font-bold">

                    {!hasDelivery &&
                      "Waiting for Delivery"}

                    {isSubmitted &&
                      "Delivery Ready for Review"}

                    {isRevisionRequested &&
                      "Revision Requested"}

                    {isApproved &&
                      "Delivery Approved"}

                  </h2>

                </div>

              </div>


              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">

                {!hasDelivery && (
                  <p className="text-sm leading-6 text-gray-700">
                    Your freelancer has not submitted the final delivery
                    yet.
                  </p>
                )}

                {isSubmitted && (
                  <p className="text-sm leading-6 text-gray-700">
                    Your freelancer has submitted the completed work.
                    Please review the delivery below.
                  </p>
                )}

                {isRevisionRequested && (
                  <p className="text-sm leading-6 text-gray-700">
                    You requested a revision. The freelancer will submit
                    the updated work here.
                  </p>
                )}

                {isApproved && (
                  <p className="text-sm leading-6 text-gray-700">
                    You approved the delivery. This project has been
                    completed successfully.
                  </p>
                )}

              </div>

            </div>


            {/* =========================
                DELIVERY REVIEW
            ========================= */}

            {latestDelivery && (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Client Review
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Final Delivery
                </h2>


                {/* MESSAGE */}

                <div className="mt-6">

                  <p className="text-sm font-semibold text-gray-500">
                    Freelancer Message
                  </p>

                  <div className="mt-2 rounded-2xl bg-gray-50 p-5">

                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {latestDelivery.message}
                    </p>

                  </div>

                </div>


                {/* FILE */}

                {latestDelivery.file_path && (
                  <div className="mt-6">

                    <p className="text-sm font-semibold text-gray-500">
                      Final File
                    </p>

                    <div className="mt-2 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                          📄
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-bold">
                            {latestDelivery.file_name ||
                              latestDelivery.file_path
                                .split("/")
                                .pop()}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Final project file
                          </p>

                        </div>

                      </div>


                      {deliveryFileUrl && (
                        <div className="flex shrink-0 gap-3">

                          <a
                            href={deliveryFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Open
                          </a>

                          <a
                            href={deliveryFileUrl}
                            download={
                              latestDelivery.file_name ||
                              "project-file"
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Download
                          </a>

                        </div>
                      )}

                    </div>

                  </div>
                )}


                {/* =========================
                    REVIEW ACTIONS
                ========================= */}

                {isSubmitted && (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">

                    {/* APPROVE */}

                    <form
                      action={async () => {
                        "use server";

                        const supabase =
                          await createClient();

                        const {
                          data: { user },
                        } =
                          await supabase.auth.getUser();

                        if (!user) {
                          redirect("/login");
                        }

                        const {
                          data: projectCheck,
                        } = await supabase
                          .from("projects")
                          .select(`
                            id,
                            client_id,
                            status
                          `)
                          .eq("id", project.id)
                          .maybeSingle();

                        if (!projectCheck) {
                          notFound();
                        }

                        if (
                          projectCheck.client_id !==
                          user.id
                        ) {
                          return;
                        }

                        if (
                          projectCheck.status !==
                          "active"
                        ) {
                          return;
                        }

                        // Approve delivery
                        const { error } =
                          await supabase
                            .from(
                              "project_deliveries"
                            )
                            .update({
                              status: "approved",
                              updated_at:
                                new Date().toISOString(),
                            })
                            .eq(
                              "id",
                              latestDelivery.id
                            )
                            .eq(
                              "client_id",
                              user.id
                            );

                        if (error) {
                          console.error(
                            "Approval error:",
                            error
                          );

                          return;
                        }

                        // Complete project
                        const {
                          error: projectUpdateError,
                        } = await supabase
                          .from("projects")
                          .update({
                            status:
                              "completed",
                          })
                          .eq(
                            "id",
                            project.id
                          )
                          .eq(
                            "client_id",
                            user.id
                          );

                        if (
                          projectUpdateError
                        ) {
                          console.error(
                            "Project completion error:",
                            projectUpdateError
                          );

                          return;
                        }

                        redirect(
                          `/projects/${project.id}/delivery`
                        );
                      }}
                    >

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700"
                      >
                        ✓ Approve Delivery
                      </button>

                    </form>


                    {/* REQUEST REVISION */}

                    <form
                      action={async () => {
                        "use server";

                        const supabase =
                          await createClient();

                        const {
                          data: { user },
                        } =
                          await supabase.auth.getUser();

                        if (!user) {
                          redirect("/login");
                        }

                        const {
                          data: projectCheck,
                        } = await supabase
                          .from("projects")
                          .select(`
                            id,
                            client_id,
                            status
                          `)
                          .eq("id", project.id)
                          .maybeSingle();

                        if (!projectCheck) {
                          notFound();
                        }

                        if (
                          projectCheck.client_id !==
                          user.id
                        ) {
                          return;
                        }

                        if (
                          projectCheck.status !==
                          "active"
                        ) {
                          return;
                        }

                        const { error } =
                          await supabase
                            .from(
                              "project_deliveries"
                            )
                            .update({
                              status:
                                "revision_requested",
                              updated_at:
                                new Date().toISOString(),
                            })
                            .eq(
                              "id",
                              latestDelivery.id
                            )
                            .eq(
                              "client_id",
                              user.id
                            );

                        if (error) {
                          console.error(
                            "Revision request error:",
                            error
                          );

                          return;
                        }

                        redirect(
                          `/projects/${project.id}/delivery`
                        );
                      }}
                    >

                      <button
                        type="submit"
                        className="w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-4 font-bold text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
                      >
                        ↻ Request Revision
                      </button>

                    </form>

                  </div>
                )}

              </div>
            )}


            {/* =========================
                NO DELIVERY
            ========================= */}

            {!latestDelivery && (
              <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

                <div className="text-5xl">
                  📦
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  No delivery submitted yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  You will be able to review and download the final work
                  once your freelancer submits it.
                </p>

              </div>
            )}

          </div>
        )}


        {/* =========================
            BACK
        ========================= */}

        <div className="mt-8 text-center">

          <Link
            href={`/projects/${project.id}`}
            className="inline-flex rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Project
          </Link>

        </div>

      </section>

    </main>
  );
}