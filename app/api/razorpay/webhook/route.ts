import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // --------------------------------
    // 1. Get webhook secret
    // --------------------------------

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "Razorpay webhook secret is missing"
      );

      return NextResponse.json(
        { error: "Webhook is not configured" },
        { status: 500 }
      );
    }

    // --------------------------------
    // 2. Read raw body
    // --------------------------------

    const rawBody = await request.text();

    // --------------------------------
    // 3. Get Razorpay signature
    // --------------------------------

    const signature =
      request.headers.get(
        "x-razorpay-signature"
      );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing Razorpay signature",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // 4. Verify webhook signature
    // --------------------------------

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(rawBody)
        .digest("hex");

    const expectedSignatureBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedSignatureBuffer =
      Buffer.from(
        signature,
        "utf8"
      );

    const signatureIsValid =
      expectedSignatureBuffer.length ===
        receivedSignatureBuffer.length &&
      crypto.timingSafeEqual(
        expectedSignatureBuffer,
        receivedSignatureBuffer
      );

    if (!signatureIsValid) {
      console.error(
        "Invalid Razorpay webhook signature"
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // 5. Parse webhook event
    // --------------------------------

    let event: any;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid webhook payload",
        },
        { status: 400 }
      );
    }

    const eventName = event?.event;

    console.log(
      "Razorpay webhook received:",
      eventName
    );

    // --------------------------------
    // 6. Handle payment.captured
    // --------------------------------

    if (
      eventName === "payment.captured"
    ) {
      const paymentEntity =
        event.payload?.payment?.entity;

      if (!paymentEntity) {
        return NextResponse.json(
          {
            error:
              "Payment data missing",
          },
          { status: 400 }
        );
      }

      const razorpayPaymentId =
        paymentEntity.id;

      const razorpayOrderId =
        paymentEntity.order_id;

      const paymentAmount =
        Number(paymentEntity.amount);

      const paymentCurrency =
        paymentEntity.currency;

      const paymentStatus =
        paymentEntity.status;

      if (
        !razorpayPaymentId ||
        !razorpayOrderId
      ) {
        return NextResponse.json(
          {
            error:
              "Payment information is incomplete",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // 7. Payment must actually be captured
      // --------------------------------

      if (
        paymentStatus !== "captured"
      ) {
        return NextResponse.json(
          {
            error:
              "Payment is not captured",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // 8. Find our payment by Razorpay order
      // --------------------------------

      const {
        data: payment,
        error: paymentLookupError,
      } =
        await supabaseAdmin
          .from("payments")
          .select(`
            id,
            project_id,
            client_id,
            freelancer_id,
            amount,
            currency,
            status,
            payment_gateway,
            gateway_payment_id,
            gateway_order_id,
            paid_at
          `)
          .eq(
            "gateway_order_id",
            razorpayOrderId
          )
          .maybeSingle();

      if (paymentLookupError) {
        console.error(
          "Webhook payment lookup error:",
          paymentLookupError
        );

        return NextResponse.json(
          {
            error:
              "Unable to lookup payment",
          },
          { status: 500 }
        );
      }

      // --------------------------------
      // 9. If payment record doesn't exist,
      //    try to identify project from Razorpay notes
      // --------------------------------

      if (!payment) {
        const projectId =
          paymentEntity.notes?.project_id;

        if (!projectId) {
          console.error(
            "Webhook payment has no project_id note:",
            razorpayOrderId
          );

          return NextResponse.json(
            {
              error:
                "Payment record not found",
            },
            { status: 404 }
          );
        }

        const {
          data: project,
          error: projectError,
        } =
          await supabaseAdmin
            .from("projects")
            .select(`
              id,
              client_id,
              freelancer_id,
              budget
            `)
            .eq("id", projectId)
            .maybeSingle();

        if (projectError) {
          console.error(
            "Webhook project lookup error:",
            projectError
          );

          return NextResponse.json(
            {
              error:
                "Unable to lookup project",
            },
            { status: 500 }
          );
        }

        if (!project) {
          return NextResponse.json(
            {
              error:
                "Project not found",
            },
            { status: 404 }
          );
        }

        const expectedAmount =
          Math.round(
            Number(project.budget) * 100
          );

        // Verify webhook amount
        if (
          !Number.isFinite(
            expectedAmount
          ) ||
          expectedAmount <= 0 ||
          paymentAmount !==
            expectedAmount
        ) {
          console.error(
            "Webhook payment amount mismatch:",
            {
              projectId,
              paymentAmount,
              expectedAmount,
            }
          );

          return NextResponse.json(
            {
              error:
                "Payment amount does not match project budget",
            },
            { status: 400 }
          );
        }

        // Verify currency
        if (
          paymentCurrency !== "INR"
        ) {
          return NextResponse.json(
            {
              error:
                "Invalid payment currency",
            },
            { status: 400 }
          );
        }

        const {
          error: insertError,
        } =
          await supabaseAdmin
            .from("payments")
            .insert({
              project_id: project.id,
              client_id: project.client_id,
              freelancer_id:
                project.freelancer_id,
              amount:
                Number(project.budget),
              currency: "INR",
              status: "paid",
              payment_gateway:
                "razorpay",
              gateway_payment_id:
                razorpayPaymentId,
              gateway_order_id:
                razorpayOrderId,
              paid_at:
                new Date().toISOString(),
            });

        if (insertError) {
          console.error(
            "Webhook payment insert error:",
            insertError
          );

          return NextResponse.json(
            {
              error:
                "Unable to save payment",
            },
            { status: 500 }
          );
        }

        console.log(
          "Payment created and marked paid by webhook:",
          razorpayPaymentId
        );

        return NextResponse.json({
          success: true,
          received: true,
        });
      }

      // --------------------------------
      // 10. Verify payment belongs to
      //     Razorpay gateway
      // --------------------------------

      if (
        payment.payment_gateway !==
        "razorpay"
      ) {
        return NextResponse.json(
          {
            error:
              "Payment gateway mismatch",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // 11. Verify amount
      // --------------------------------

      const expectedAmount =
        Math.round(
          Number(payment.amount) * 100
        );

      if (
        !Number.isFinite(
          expectedAmount
        ) ||
        expectedAmount <= 0 ||
        paymentAmount !==
          expectedAmount
      ) {
        console.error(
          "Webhook payment amount mismatch:",
          {
            razorpayOrderId,
            paymentAmount,
            expectedAmount,
          }
        );

        return NextResponse.json(
          {
            error:
              "Payment amount does not match database amount",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // 12. Verify currency
      // --------------------------------

      if (
        paymentCurrency !==
          "INR" ||
        payment.currency !== "INR"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid payment currency",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // 13. Handle already-paid payment
      // --------------------------------

      if (
        payment.status === "paid"
      ) {
        // Same payment ID = safe duplicate webhook
        if (
          payment.gateway_payment_id ===
          razorpayPaymentId
        ) {
          console.log(
            "Duplicate payment.captured webhook ignored:",
            razorpayPaymentId
          );

          return NextResponse.json({
            success: true,
            received: true,
            duplicate: true,
          });
        }

        // Different payment ID for an already-paid project
        console.error(
          "Payment already marked paid with a different Razorpay payment ID:",
          {
            projectId:
              payment.project_id,
            existingPaymentId:
              payment.gateway_payment_id,
            receivedPaymentId:
              razorpayPaymentId,
          }
        );

        return NextResponse.json(
          {
            error:
              "Project payment is already completed",
          },
          { status: 409 }
        );
      }

      // --------------------------------
      // 14. Mark payment as paid
      // --------------------------------

      const {
        error: updateError,
      } =
        await supabaseAdmin
          .from("payments")
          .update({
            status: "paid",
            gateway_payment_id:
              razorpayPaymentId,
            paid_at:
              new Date().toISOString(),
          })
          .eq("id", payment.id)
          .neq("status", "paid");

      if (updateError) {
        console.error(
          "Webhook payment update error:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              "Unable to update payment",
          },
          { status: 500 }
        );
      }

      console.log(
        "Payment marked as paid by webhook:",
        payment.id
      );
    }

    // --------------------------------
    // 15. Handle payment.failed
    // --------------------------------

    if (
      eventName === "payment.failed"
    ) {
      const paymentEntity =
        event.payload?.payment?.entity;

      const razorpayOrderId =
        paymentEntity?.order_id;

      if (razorpayOrderId) {
        console.log(
          "Razorpay payment failed for order:",
          razorpayOrderId
        );

        /*
         * We intentionally do not change the
         * database payment status here.
         *
         * The client may retry the same project
         * payment, and the payment record remains
         * available for another Razorpay order.
         */
      }
    }

    // --------------------------------
    // 16. Ignore other events safely
    // --------------------------------

    return NextResponse.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}