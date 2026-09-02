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

  // Get request
  const { data: projectRequest, error: fetchError } =
    await supabase
      .from("project_requests")
      .select(
        "id, client_id, creator_id, project_title, description, service, budget, deadline, status"
      )
      .eq("id", id)
      .maybeSingle();

  if (fetchError || !projectRequest) {
    return NextResponse.json(
      { error: "Project request not found." },
      { status: 404 }
    );
  }

  // Make sure this request belongs to the logged-in creator
  if (projectRequest.creator_id !== user.id) {
    return NextResponse.json(
      {
        error:
          "You are not allowed to accept this request.",
      },
      { status: 403 }
    );
  }

  // Only pending requests can be accepted
  if (projectRequest.status !== "pending") {
    return NextResponse.json(
      {
        error:
          "This request has already been processed.",
      },
      { status: 400 }
    );
  }

  // Accept request
  const { error: updateError } = await supabase
    .from("project_requests")
    .update({
      status: "accepted",
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

  // Create project from accepted request
  const { error: projectError } = await supabase
    .from("projects")
    .insert({
      request_id: projectRequest.id,
      client_id: projectRequest.client_id,
      freelancer_id: projectRequest.creator_id,
      title: projectRequest.project_title,
      description: projectRequest.description,
      budget: projectRequest.budget,
      deadline: projectRequest.deadline,
      status: "active",
    });

  if (projectError) {
    // If project creation fails, revert request back to pending
    await supabase
      .from("project_requests")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("creator_id", user.id);

    return NextResponse.json(
      {
        error:
          "Request was accepted, but project creation failed: " +
          projectError.message,
      },
      { status: 500 }
    );
  }

  // Redirect after successful acceptance
  return NextResponse.redirect(
    new URL("/requests", request.url)
  );
}