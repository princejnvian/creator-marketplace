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
          .slice(0, 8)
      : [];

    const categories = Array.isArray(body.categories)
      ? body.categories
          .filter(
            (category: unknown): category is string =>
              typeof category === "string"
          )
          .map((category: string) => category.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    const primaryCategory =
      typeof body.primaryCategory === "string"
        ? body.primaryCategory.trim()
        : "";

    const startingPrice =
      body.startingPrice === null || body.startingPrice === undefined || body.startingPrice === ""
        ? null
        : Number(body.startingPrice);

    const servicePackages =
      Array.isArray(body.servicePackages)
        ? body.servicePackages.slice(0, 3).map((item: any) => ({
            id: typeof item?.id === "string" ? item.id : "",
            name: typeof item?.name === "string" ? item.name.trim() : "",
            description: typeof item?.description === "string" ? item.description.trim().slice(0, 500) : "",
            price: Math.max(0, Number(item?.price) || 0),
            deliveryDays: Math.max(1, Number(item?.deliveryDays) || 1),
            revisions: Math.max(0, Number(item?.revisions) || 0),
          }))
        : [];

    const portfolio =
      Array.isArray(body.portfolio)
        ? body.portfolio.slice(0, 12).map((item: any) => ({
            id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
            title: typeof item?.title === "string" ? item.title.trim().slice(0, 120) : "Portfolio work",
            description: typeof item?.description === "string" ? item.description.trim().slice(0, 500) : "",
            url: typeof item?.url === "string" ? item.url.trim() : "",
            mediaType: item?.mediaType === "video" || item?.mediaType === "audio" ? item.mediaType : "image",
            category: typeof item?.category === "string" ? item.category.trim().slice(0, 80) : "Creative Work",
          }))
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

    if (skills.length > 8) {
      return NextResponse.json(
        {
          error: "You can select up to 8 skills.",
        },
        {
          status: 400,
        }
      );
    }

    if (categories.length > 3) {
      return NextResponse.json(
        { error: "You can select up to 3 categories." },
        { status: 400 }
      );
    }

    if (primaryCategory && !categories.includes(primaryCategory)) {
      return NextResponse.json(
        { error: "Primary category must be one of your selected categories." },
        { status: 400 }
      );
    }

    if (startingPrice !== null && (!Number.isFinite(startingPrice) || startingPrice < 0 || startingPrice > 10000000)) {
      return NextResponse.json(
        { error: "Starting price must be between ₹0 and ₹10,000,000." },
        { status: 400 }
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

    if (accountType === "freelancer" && portfolio.some((item: any) => !item.url)) {
      return NextResponse.json(
        { error: "Every portfolio item must have a valid media URL." },
        { status: 400 }
      );
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
            categories: accountType === "freelancer" ? categories : [],
            primary_category: accountType === "freelancer" ? primaryCategory || null : null,
            starting_price: accountType === "freelancer" ? startingPrice : null,
            service_packages: accountType === "freelancer" ? servicePackages : [],
            portfolio: accountType === "freelancer" ? portfolio : [],
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        )
        .select(
          "id, full_name, username, bio, account_type, skills, categories, primary_category, starting_price, service_packages, portfolio, avatar_url"
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