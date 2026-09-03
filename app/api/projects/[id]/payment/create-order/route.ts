import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: Props
) {
  try {
    const supabase = await createClient();

    // --------------------------------
    // 1. Authenticate user
    // --------------------------------

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------
    // 2. Get project ID from URL
    // --------------------------------

    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // --------------------------------
    // 3. Validate UUID format
    // --------------------------------

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // --------------------------------
    // 4. Get project
    // --------------------------------

    const {
      data: project,
      error: projectError,
    } = await supabase
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
      console.error(
        "Project fetch error:",
        projectError
      );

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

    // --------------------------------
    // 5. Only project client can pay
    // --------------------------------

    if (project.client_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the client can make this payment",
        },
        { status: 403 }
      );
    }

    // --------------------------------
    // 6. Payment only for active projects
    // --------------------------------

    if (project.status !== "active") {
      return NextResponse.json(
        {
          error:
            "Payment is only allowed for active projects",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // 7. Validate project amount
    // --------------------------------

    const amount = Number(project.budget);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid project amount" },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(
      amount * 100
    );

    if (amountInPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // --------------------------------
    // 8. Check existing payment
    // --------------------------------

    const {
      data: existingPayment,
      error: existingPaymentError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        "id, status, gateway_order_id"
      )
      .eq("project_id", project.id)
      .maybeSingle();

    if (existingPaymentError) {
      console.error(
        "Existing payment lookup error:",
        existingPaymentError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check existing payment",
        },
        { status: 500 }
      );
    }

    if (existingPayment?.status === "paid") {
      return NextResponse.json(
        {
          error:
            "This project has already been paid.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // 9. Razorpay configuration
    // --------------------------------

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error(
        "Razorpay environment variables are missing"
      );

      return NextResponse.json(
        {
          error:
            "Razorpay is not configured on the server",
        },
        { status: 500 }
      );
    }

    // --------------------------------
    // 10. Create Razorpay client
    // --------------------------------

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // --------------------------------
    // 11. Create Razorpay order
    // --------------------------------

    const order =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `crevo_${project.id}_${Date.now()}`,
        notes: {
          project_id: project.id,
          client_id: project.client_id,
          freelancer_id:
            project.freelancer_id,
        },
      });

    // --------------------------------
    // 12. Save pending payment record
    // --------------------------------

    const paymentData = {
      project_id: project.id,
      client_id: project.client_id,
      freelancer_id:
        project.freelancer_id,
      amount,
      currency: "INR",
      status: "pending",
      payment_gateway: "razorpay",
      gateway_payment_id: null,
      gateway_order_id: order.id,
      paid_at: null,
    };

    let paymentSaveError = null;

    if (existingPayment) {
      const { error } =
        await supabaseAdmin
          .from("payments")
          .update(paymentData)
          .eq("id", existingPayment.id);

      paymentSaveError = error;
    } else {
      const { error } =
        await supabaseAdmin
          .from("payments")
          .insert(paymentData);

      paymentSaveError = error;
    }

    if (paymentSaveError) {
      console.error(
        "Payment record save error:",
        paymentSaveError
      );

      return NextResponse.json(
        {
          error:
            "Razorpay order was created, but payment record could not be saved.",
        },
        { status: 500 }
      );
    }

    // --------------------------------
    // 13. Return order details
    // --------------------------------

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      projectId: project.id,
    });
  } catch (error) {
    console.error(
      "Razorpay create order error:",
      error
    );

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