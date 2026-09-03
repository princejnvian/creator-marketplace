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

  // Atomically accept the request and create the project.
  // The PostgreSQL function handles locking and transaction safety.
  const { error } = await supabase.rpc(
    "accept_project_request",
    {
      p_request_id: id,
    }
  );

  if (error) {
    console.error(
      "Accept project request error:",
      error
    );

    if (
      error.message.includes(
        "Project request not found"
      )
    ) {
      return NextResponse.json(
        {
          error: "Project request not found.",
        },
        { status: 404 }
      );
    }

    if (
      error.message.includes(
        "You are not allowed to accept this request"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to accept this request.",
        },
        { status: 403 }
      );
    }

    if (
      error.message.includes(
        "This request has already been processed"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This request has already been processed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to accept the project request.",
      },
      { status: 500 }
    );
  }

  // Redirect after successful acceptance
  return NextResponse.redirect(
    new URL("/requests", request.url)
  );
}