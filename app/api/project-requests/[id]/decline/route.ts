import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: Props
) {
  const supabase = await createClient();

  // Logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  const { id } = await params;

  // Check request
  const { data: projectRequest, error: fetchError } =
    await supabase
      .from("project_requests")
      .select("id, creator_id, status")
      .eq("id", id)
      .maybeSingle();

  if (fetchError || !projectRequest) {
    return NextResponse.json(
      { error: "Project request not found." },
      { status: 404 }
    );
  }

  // Only the assigned creator can decline it
  if (projectRequest.creator_id !== user.id) {
    return NextResponse.json(
      { error: "You are not allowed to decline this request." },
      { status: 403 }
    );
  }

  // Only pending requests can be declined
  if (projectRequest.status !== "pending") {
    return NextResponse.json(
      { error: "This request has already been processed." },
      { status: 400 }
    );
  }

  // Decline request
  const { error: updateError } = await supabase
    .from("project_requests")
    .update({
      status: "declined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/requests", request.url)
  );
}
