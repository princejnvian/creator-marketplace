import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MessagesPage({ params }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  // Get project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      id,
      request_id,
      client_id,
      freelancer_id,
      title,
      status
    `)
    .eq("id", id)
    .maybeSingle();

  if (projectError || !project) {
    notFound();
  }

  // Only project members can access messages
  const isClient = project.client_id === user.id;
  const isFreelancer = project.freelancer_id === user.id;

  if (!isClient && !isFreelancer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Access Denied
          </h1>

          <p className="mt-3 text-gray-600">
            You are not a member of this project.
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

  // Get messages using project_request_id
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select(`
      id,
      sender_id,
      receiver_id,
      project_request_id,
      content,
      created_at
    `)
    .eq("project_request_id", project.request_id)
    .order("created_at", { ascending: true });

  // Send message
  async function sendMessage(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const message = String(formData.get("message") || "").trim();

    if (!message) {
      return;
    }

    // Get project again for security
    const { data: currentProject } = await supabase
      .from("projects")
      .select(`
        id,
        request_id,
        client_id,
        freelancer_id
      `)
      .eq("id", id)
      .maybeSingle();

    if (!currentProject) {
      return;
    }

    const isProjectMember =
      currentProject.client_id === user.id ||
      currentProject.freelancer_id === user.id;

    if (!isProjectMember) {
      return;
    }

    const receiverId =
      currentProject.client_id === user.id
        ? currentProject.freelancer_id
        : currentProject.client_id;

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        project_request_id: currentProject.request_id,
        content: message,
      });

    if (error) {
      console.error("Message send error:", error);
      return;
    }

    revalidatePath(`/projects/${id}/messages`);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

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

      {/* Page */}
      <section className="mx-auto max-w-4xl px-6 py-10">

        {/* Header */}
        <div className="mb-6">

          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Project Messages
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {project.title}
          </h1>

          <p className="mt-2 text-gray-600">
            {isClient
              ? "Chat with your freelancer."
              : "Chat with your client."}
          </p>

        </div>

        {/* Chat Box */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* Messages */}
          <div className="min-h-[450px] space-y-4 bg-gray-50 p-6">

            {messagesError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Unable to load messages.
                <p className="mt-1">
                  {messagesError.message}
                </p>
              </div>
            )}

            {!messagesError &&
              (!messages || messages.length === 0) && (
                <div className="flex min-h-[400px] items-center justify-center text-center">

                  <div>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
                      💬
                    </div>

                    <h2 className="mt-5 text-xl font-bold">
                      No messages yet
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      Start the conversation with your{" "}
                      {isClient ? "freelancer" : "client"}.
                    </p>
                  </div>

                </div>
              )}

            {messages &&
              messages.length > 0 &&
              messages.map((message) => {

                const mine = message.sender_id === user.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      mine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                        mine
                          ? "rounded-br-md bg-blue-600 text-white"
                          : "rounded-bl-md bg-white text-gray-900 shadow-sm border border-gray-200"
                      }`}
                    >

                      <p className="whitespace-pre-wrap leading-6">
                        {message.content}
                      </p>

                      <p
                        className={`mt-1 text-[11px] ${
                          mine
                            ? "text-blue-100"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(
                          message.created_at
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>

                    </div>

                  </div>
                );
              })}

          </div>

          {/* Send Message */}
          <div className="border-t border-gray-200 bg-white p-5">

            <form
              action={sendMessage}
              className="flex flex-col gap-3 sm:flex-row"
            >

              <input
                type="text"
                name="message"
                required
                placeholder="Write a message..."
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              />

              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Send
              </button>

            </form>

          </div>

        </div>

      </section>

    </main>
  );
}