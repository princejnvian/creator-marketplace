import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

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

    const projectId = String(body.projectId || "");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        id,
        client_id,
        freelancer_id,
        title,
        budget,
        status
      `)
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Project fetch error:", projectError);

      return NextResponse.json(
        { error: "Unable to fetch project" },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Only project client can pay
    if (project.client_id !== user.id) {
      return NextResponse.json(
        { error: "Only the client can make this payment" },
        { status: 403 }
      );
    }
// Check whether this project is already paid
const { data: existingPayment } = await supabase
  .from("payments")
  .select("id, status")
  .eq("project_id", project.id)
  .maybeSingle();

if (existingPayment?.status === "paid") {
  return NextResponse.json(
    { error: "This project has already been paid." },
    { status: 400 }
  );
}

    // Validate budget
    const amount = Number(project.budget);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid project amount" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay environment variables are missing");

      return NextResponse.json(
        { error: "Razorpay is not configured on the server" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Razorpay expects amount in paise
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `crevo_${project.id}`,
      notes: {
        project_id: project.id,
        client_id: project.client_id,
        freelancer_id: project.freelancer_id,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      projectId: project.id,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}