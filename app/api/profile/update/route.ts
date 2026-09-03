import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const allowedAccountTypes = ["client", "freelancer"] as const;

export async function POST(request: Request) {
  try {
    // ================= AUTH =================

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // ================= READ REQUEST =================

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

    const avatarUrl =
      typeof body.avatarUrl === "string"
        ? body.avatarUrl.trim()
        : "";

    const skills = Array.isArray(body.skills)
      ? body.skills
          .filter(
            (skill: unknown): skill is string =>
              typeof skill === "string"
          )
          .map((skill: string) => skill.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    // ================= VALIDATION =================

    if (!fullName) {
      return NextResponse.json(
        {
          error: "Please enter your full name.",
        },
        {
          status: 400,
        }
      );
    }

    if (fullName.length > 100) {
      return NextResponse.json(
        {
          error: "Full name must be 100 characters or less.",
        },
        {
          status: 400,
        }
      );
    }

    if (!username) {
      return NextResponse.json(
        {
          error: "Please choose a username.",
        },
        {
          status: 400,
        }
      );
    }

    if (username.length > 30) {
      return NextResponse.json(
        {
          error: "Username must be 30 characters or less.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username can only contain lowercase letters, numbers and underscores.",
        },
        {
          status: 400,
        }
      );
    }

    if (bio.length > 500) {
      return NextResponse.json(
        {
          error: "Bio must be 500 characters or less.",
        },
        {
          status: 400,
        }
      );
    }

    if (skills.length > 5) {
      return NextResponse.json(
        {
          error: "You can select up to 5 skills.",
        },
        {
          status: 400,
        }
      );
    }

    // ================= EXISTING PROFILE =================

    const { data: existingProfile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);

      return NextResponse.json(
        {
          error: "Unable to load your existing profile.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * SECURITY:
     *
     * We NEVER accept account_type from the browser.
     *
     * If the profile already exists, its existing account_type
     * is preserved.
     *
     * For a brand-new profile, we use the account_type stored
     * in the user's signup metadata, if valid.
     */

    let accountType:
      | (typeof allowedAccountTypes)[number]
      | null = null;

    if (
      existingProfile?.account_type === "client" ||
      existingProfile?.account_type === "freelancer"
    ) {
      accountType = existingProfile.account_type;
    } else {
      const metadataAccountType =
        user.user_metadata?.account_type;

      if (
        metadataAccountType === "client" ||
        metadataAccountType === "freelancer"
      ) {
        accountType = metadataAccountType;
      } else {
        accountType = "client";
      }
    }

    // ================= UPDATE PROFILE =================

    const { data: updatedProfile, error: updateError } =
      await supabaseAdmin
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
        )
        .select(
          "id, full_name, username, bio, account_type, skills, avatar_url"
        )
        .single();

    if (updateError) {
      console.error("Profile update error:", updateError);

      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "That username is already taken. Please choose another one.",
            code: updateError.code,
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error: "Unable to update your profile.",
        },
        {
          status: 500,
        }
      );
    }

    // ================= SUCCESS =================

    return NextResponse.json(
      {
        success: true,
        profile: updatedProfile,
        accountType,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Profile API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while updating your profile.",
      },
      {
        status: 500,
      }
    );
  }
}