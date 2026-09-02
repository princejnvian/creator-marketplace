import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const supabase = await createClient();

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get payment details sent by Razorpay Checkout
    const body = await request.json();

    const razorpayPaymentId = String(
      body.razorpay_payment_id || ""
    );

    const razorpayOrderId = String(
      body.razorpay_order_id || ""
    );

    const razorpaySignature = String(
      body.razorpay_signature || ""
    );

    if (
      !razorpayPaymentId ||
      !razorpayOrderId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        { error: "Incomplete Razorpay payment response" },
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

    // Only project client can complete the payment
    if (project.client_id !== user.id) {
      return NextResponse.json(
        { error: "Only the client can make this payment" },
        { status: 403 }
      );
    }

    // Validate project amount
    const projectAmount = Number(project.budget);

    if (!Number.isFinite(projectAmount) || projectAmount <= 0) {
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

    /*
     * IMPORTANT:
     * Fetch the order from Razorpay's server.
     *
     * We do NOT blindly trust the order_id sent by the browser.
     */
    const razorpayOrder = await razorpay.orders.fetch(
      razorpayOrderId
    );

    // Make sure this Razorpay order belongs to this Crevo project
    if (
      razorpayOrder.notes?.project_id !== project.id
    ) {
      return NextResponse.json(
        { error: "Payment order does not belong to this project" },
        { status: 400 }
      );
    }

    // Verify amount
    const expectedAmount = Math.round(projectAmount * 100);

    if (Number(razorpayOrder.amount) !== expectedAmount) {
      return NextResponse.json(
        { error: "Payment amount does not match project amount" },
        { status: 400 }
      );
    }

    // Verify currency
    if (razorpayOrder.currency !== "INR") {
      return NextResponse.json(
        { error: "Invalid payment currency" },
        { status: 400 }
      );
    }

    /*
     * Razorpay signature verification
     *
     * HMAC-SHA256:
     *
     * order_id + "|" + payment_id
     */
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${razorpayOrder.id}|${razorpayPaymentId}`
      )
      .digest("hex");

    if (
      generatedSignature !== razorpaySignature
    ) {
      console.error("Invalid Razorpay payment signature");

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    /*
     * Signature is valid.
     *
     * Now fetch the actual payment from Razorpay
     * and check its status.
     */
    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpayPaymentId
      );

    if (
      razorpayPayment.order_id !== razorpayOrder.id
    ) {
      return NextResponse.json(
        { error: "Payment does not match Razorpay order" },
        { status: 400 }
      );
    }

    if (Number(razorpayPayment.amount) !== expectedAmount) {
      return NextResponse.json(
        { error: "Payment amount verification failed" },
        { status: 400 }
      );
    }

    if (razorpayPayment.currency !== "INR") {
      return NextResponse.json(
        { error: "Payment currency verification failed" },
        { status: 400 }
      );
    }

    /*
     * We mark the Crevo payment as paid only
     * when Razorpay says the payment is captured.
     */
    if (razorpayPayment.status !== "captured") {
      return NextResponse.json(
        {
          error: `Payment is not captured yet. Current status: ${razorpayPayment.status}`,
        },
        { status: 400 }
      );
    }

    // Check whether a payment record already exists
    const { data: existingPayment, error: existingPaymentError } =
      await supabase
        .from("payments")
        .select("id, status")
        .eq("project_id", project.id)
        .maybeSingle();

    if (existingPaymentError) {
      console.error(
        "Existing payment lookup error:",
        existingPaymentError
      );

      return NextResponse.json(
        { error: "Unable to check existing payment" },
        { status: 500 }
      );
    }

       const paymentData = {
      project_id: project.id,
      client_id: project.client_id,
      freelancer_id: project.freelancer_id,
      amount: projectAmount,
      currency: "INR",
      status: "paid",
      payment_gateway: "razorpay",
      gateway_payment_id: razorpayPaymentId,
      gateway_order_id: razorpayOrder.id,
      paid_at: new Date().toISOString(),
    };
    let paymentError = null;

    if (existingPayment) {
      const { error } = await supabase
        .from("payments")
        .update(paymentData)
        .eq("id", existingPayment.id);

      paymentError = error;
    } else {
      const { error } = await supabase
        .from("payments")
        .insert(paymentData);

      paymentError = error;
    }

   if (paymentError) {
  console.error(
    "Payment database update error:",
    paymentError
  );

  return NextResponse.json(
    {
      error: "Payment database save failed",
      details: paymentError.message,
      code: paymentError.code,
      hint: paymentError.hint,
      details_from_supabase: paymentError.details,
    },
    { status: 500 }
  );
}

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      projectId: project.id,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrder.id,
      status: "paid",
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment verification failed",
      },
      { status: 500 }
    );
  }
}