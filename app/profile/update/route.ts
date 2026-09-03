import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const username =
      typeof body.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    const bio =
      typeof body.bio === "string"
        ? body.bio.trim()
        : "";

    const skills = Array.isArray(body.skills)
      ? body.skills.filter(
          (skill: unknown): skill is string =>
            typeof skill === "string"
        )
      : [];

    const avatarUrl =
      typeof body.avatarUrl === "string"
        ? body.avatarUrl.trim()
        : "";

    if (!fullName) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "Please choose a username." },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username can only contain lowercase letters, numbers and underscores.",
        },
        { status: 400 }
      );
    }

    if (username.length > 30) {
      return NextResponse.json(
        { error: "Username must be 30 characters or less." },
        { status: 400 }
      );
    }

    if (fullName.length > 100) {
      return NextResponse.json(
        { error: "Full name must be 100 characters or less." },
        { status: 400 }
      );
    }

    if (bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or less." },
        { status: 400 }
      );
    }

    if (skills.length > 5) {
      return NextResponse.json(
        { error: "You can select up to 5 skills." },
        { status: 400 }
      );
    }

    const { data: existingProfile, error: profileFetchError } =
      await supabaseAdmin
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();

    if (profileFetchError) {
      console.error(profileFetchError);

      return NextResponse.json(
        { error: "Unable to load your profile." },
        { status: 500 }
      );
    }

    /*
     * IMPORTANT:
     * account_type is deliberately NOT taken from the request.
     *
     * This prevents a user from changing their account type
     * through a manually crafted API request.
     *
     * If no profile exists yet, use the account type stored
     * in authenticated user metadata, falling back to client.
     */
    const accountType =
      existingProfile?.account_type === "freelancer" ||
      existingProfile?.account_type === "client"
        ? existingProfile.account_type
        : user.user_metadata?.account_type === "freelancer"
        ? "freelancer"
        : "client";

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          username,
          bio,
          account_type: accountType,
          skills,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (updateError) {
      console.error(updateError);

      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "That username is already taken. Please choose another one.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Unable to save your profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accountType,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      { error: "Something went wrong while saving your profile." },
      { status: 500 }
    );
  }
}