import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({ params }: Props) {
  const supabase = await createClient();

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
      request_id,
      client_id,
      freelancer_id,
      title,
      description,
      budget,
      deadline,
      status,
      created_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  // Only project members can access
  if (
    project.client_id !== user.id &&
    project.freelancer_id !== user.id
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-gray-900">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Access Denied
          </h1>

          <p className="mt-3 text-gray-600">
            You are not allowed to view this project.
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

  // Get payment
  const { data: payment } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      currency,
      status,
      payment_gateway,
      gateway_payment_id,
      gateway_order_id,
      paid_at,
      created_at
    `)
    .eq("project_id", project.id)
    .maybeSingle();

  const paymentStatus = payment?.status || "pending";

  const statusLabel =
    project.status === "active"
      ? "Active"
      : project.status === "completed"
      ? "Completed"
      : project.status === "cancelled"
      ? "Cancelled"
      : project.status;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="text-2xl font-extrabold tracking-tight text-gray-900"
          >
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-semibold text-gray-600 hover:text-blue-600"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Project Workspace
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900">
            {project.title}
          </h1>

          <p className="mt-3 text-gray-600">
            {isClient
              ? "Manage your project with the freelancer."
              : "Manage this project and work with your client."}
          </p>
        </div>

        {/* Project Status */}
        <div className="mb-6">
          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${
              project.status === "active"
                ? "bg-green-100 text-green-700"
                : project.status === "completed"
                ? "bg-blue-100 text-blue-700"
                : project.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            ● {statusLabel}
          </span>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* Project Description */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900">
              Project Description
            </h2>

            <p className="mt-4 whitespace-pre-wrap leading-7 text-gray-600">
              {project.description}
            </p>
          </div>

          {/* Project Details */}
          <div className="grid gap-6 p-8 sm:grid-cols-3">

            {/* Budget */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Budget
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {project.budget !== null
                  ? `₹${Number(project.budget).toLocaleString("en-IN")}`
                  : "Not specified"}
              </p>
            </div>

            {/* Deadline */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Deadline
              </p>

              <p className="mt-2 text-lg font-bold text-gray-900">
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : "Not specified"}
              </p>
            </div>

            {/* Role */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Your Role
              </p>

              <p className="mt-2 text-lg font-bold text-gray-900">
                {isClient ? "Client" : "Freelancer"}
              </p>
            </div>
          </div>

          {/* PAYMENT SECTION */}
          <div className="border-t border-gray-200 p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Payment
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Project Payment
                </h2>

                <p className="mt-2 text-gray-600">
                  {project.budget !== null
                    ? `Total project amount: ₹${Number(
                        project.budget
                      ).toLocaleString("en-IN")}`
                    : "No project budget specified."}
                </p>
              </div>

              {/* CLIENT PAYMENT */}
              {isClient && project.budget !== null && (
                <div className="sm:text-right">

                  {paymentStatus === "paid" ? (
                    <div>
                      <span className="inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                        ✓ Payment Paid
                      </span>

                      {payment?.paid_at && (
                        <p className="mt-2 text-xs text-gray-500">
                          Paid on{" "}
                          {new Date(
                            payment.paid_at
                          ).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={`/projects/${project.id}/payment`}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      Pay Now →
                    </Link>
                  )}

                </div>
              )}

              {/* FREELANCER PAYMENT STATUS */}
              {!isClient && (
                <div className="sm:text-right">

                  {paymentStatus === "paid" ? (
                    <span className="inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                      ✓ Client Paid
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700">
                      Payment Pending
                    </span>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="border-t border-gray-200 bg-gray-50 p-8">

            <h2 className="text-xl font-bold text-gray-900">
              Project Workspace
            </h2>

            <p className="mt-2 text-gray-600">
              Messaging, file sharing, delivery and project
              completion features are available here.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">

              {/* Messages */}
              <Link
                href={`/projects/${project.id}/messages`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-2xl">
                  💬
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  Messages
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Chat with your{" "}
                  {isClient ? "freelancer" : "client"}.
                </p>

                <p className="mt-4 text-sm font-semibold text-blue-600">
                  Open Messages →
                </p>
              </Link>

              {/* Files */}
              <Link
                href={`/projects/${project.id}/files`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-2xl">
                  📁
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  Files
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Share project files and documents.
                </p>

                <p className="mt-4 text-sm font-semibold text-blue-600">
                  Open Files →
                </p>
              </Link>

              {/* Delivery */}
              <Link
                href={`/projects/${project.id}/delivery`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-2xl">
                  🚀
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  Delivery
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Submit and manage project delivery.
                </p>

                <p className="mt-4 text-sm font-semibold text-blue-600">
                  Open Delivery →
                </p>
              </Link>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}