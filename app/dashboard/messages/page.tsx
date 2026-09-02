import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/dashboard"
            className="text-2xl font-extrabold tracking-tight"
          >
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            ← Dashboard
          </Link>

        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto max-w-5xl px-6 py-12">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Messages
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Your Messages
          </h1>

          <p className="mt-3 text-gray-600">
            Chat with clients and creators about your projects.
          </p>
        </div>

        {/* Chat Box */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Chat Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
                💬
              </div>

              <div>
                <h2 className="font-bold">
                  Project Conversation
                </h2>

                <p className="text-sm text-gray-500">
                  Select a project to start chatting
                </p>
              </div>

            </div>
          </div>

          {/* Empty Messages */}
          <div className="flex min-h-[350px] items-center justify-center p-8">

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
                💬
              </div>

              <h3 className="mt-5 text-xl font-bold">
                No conversation selected
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                Once a project is accepted, you will be able to
                communicate with the client or creator here.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}