import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FileUpload from "./FileUpload";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FilesPage({ params }: Props) {
  const supabase = await createClient();

  // Logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  // Get project
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      id,
      client_id,
      freelancer_id,
      title,
      description
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  // Only project members can access files
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

  // Get files from Supabase Storage
  const {
    data: files,
    error: filesError,
  } = await supabase.storage
    .from("project-files")
    .list(project.id, {
      limit: 100,
      sortBy: {
        column: "created_at",
        order: "desc",
      },
    });

  /*
   * Create signed URLs BEFORE rendering the files.
   *
   * IMPORTANT:
   * await cannot be used directly inside files.map()
   * unless the callback is async.
   *
   * So we prepare the files here first.
   */
  const filesWithUrls =
    files && !filesError
      ? await Promise.all(
          files.map(async (file) => {
            const filePath = `${project.id}/${file.name}`;

            const { data: signedUrlData } =
              await supabase.storage
                .from("project-files")
                .createSignedUrl(filePath, 60 * 60);

            return {
              ...file,
              signedUrl: signedUrlData?.signedUrl || null,
            };
          })
        )
      : [];

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

          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-semibold text-gray-600 hover:text-blue-600"
          >
            ← Back to Project
          </Link>

        </div>
      </nav>

      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-4xl px-6 py-12">

        {/* Header */}

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Project Files
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Files & Documents
          </h1>

          <p className="mt-3 text-gray-600">
            Share project files securely with your{" "}
            {isClient ? "freelancer" : "client"}.
          </p>

        </div>

        {/* ================= PROJECT INFO ================= */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <p className="text-sm font-semibold text-gray-500">
            Project
          </p>

          <h2 className="mt-1 text-xl font-bold">
            {project.title}
          </h2>

          {project.description && (
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {project.description}
            </p>
          )}

        </div>

        {/* ================= UPLOAD ================= */}

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

          <FileUpload projectId={project.id} />

        </div>

        {/* ================= FILE LIST ================= */}

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* Header */}

          <div className="border-b border-gray-200 p-6">

            <h2 className="text-xl font-bold">
              Project Files
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Files shared for this project.
            </p>

          </div>

          {/* ================= ERROR ================= */}

          {filesError && (
            <div className="p-6">

              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <p className="font-semibold">
                  Unable to load project files.
                </p>

                <p className="mt-1">
                  {filesError.message}
                </p>

              </div>

            </div>
          )}

          {/* ================= EMPTY ================= */}

          {!filesError &&
            filesWithUrls.length === 0 && (
              <div className="p-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                  📂
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  No files yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Upload your first project file above.
                </p>

              </div>
            )}

          {/* ================= FILES ================= */}

          {!filesError &&
            filesWithUrls.length > 0 && (
              <div className="divide-y divide-gray-100">

                {filesWithUrls.map((file) => {

                  const fileSize =
                    file.metadata?.size
                      ? formatFileSize(
                          Number(file.metadata.size)
                        )
                      : "Unknown size";

                  return (
                    <div
                      key={`${file.name}-${file.created_at}`}
                      className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                    >

                      {/* File Info */}

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                          📄
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate font-bold text-gray-900">
                            {file.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {fileSize}
                          </p>

                        </div>

                      </div>

                      {/* Actions */}

                      <div className="flex shrink-0 gap-3">

                        <a
                          href={file.signedUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Open
                        </a>

                        <a
                          href={file.signedUrl || "#"}
                          download={file.name}
                          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Download
                        </a>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </div>

      </section>

    </main>
  );
}

/* =========================
   FILE SIZE FORMATTER
========================= */

function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return (
    parseFloat(
      (bytes / Math.pow(1024, index)).toFixed(2)
    ) +
    " " +
    units[index]
  );
}