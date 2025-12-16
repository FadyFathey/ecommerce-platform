// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events and updates orders/payment_status

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// NOTE: This must be configured as SERVICE_ROLE_KEY in the Supabase Dashboard env vars.
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "stripe-webhook: Missing required env vars",
    JSON.stringify({
      hasStripeSecret: !!STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRoleKey: !!SERVICE_ROLE_KEY,
    }),
  );
  throw new Error("Missing required environment variables for webhook handler");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function updateOrderStatus(orderId: string, paymentStatus: string, status?: string) {
  console.log(
    "stripe-webhook: updating order status",
    JSON.stringify({
      orderId,
      paymentStatus,
      status,
    }),
  );

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      status: status ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error(
      "stripe-webhook: failed to update order",
      JSON.stringify({ orderId, message: error.message, details: error.details }),
    );
  }
}

serve(async (req) => {
  console.log(
    "stripe-webhook: incoming request",
    JSON.stringify({
      method: req.method,
      origin: req.headers.get("origin"),
    }),
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.warn("stripe-webhook: missing signature header");
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    console.log(
      "stripe-webhook: event constructed",
      JSON.stringify({
        id: event.id,
        type: event.type,
      }),
    );
  } catch (err) {
    console.error("stripe-webhook: webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        console.log(
          "stripe-webhook: payment_intent.succeeded",
          JSON.stringify({
            paymentIntentId: pi.id,
            orderId,
            status: pi.status,
          }),
        );
        if (orderId) {
          // Update order status
          await updateOrderStatus(orderId, "paid", "paid");
          
          // Decrement stock now that payment succeeded
          const { error: stockError } = await supabase.rpc("decrement_order_stock", {
            order_uuid: orderId,
          });
          
          if (stockError) {
            console.error("stripe-webhook: failed to decrement stock", stockError);
            // Don't fail the webhook if stock update fails, but log it
          } else {
            console.log("stripe-webhook: stock decremented for order", orderId);
          }

          // Send order confirmation email
          try {
            await supabase.functions.invoke("send-order-email", {
              body: { orderId, emailType: "confirmation" },
            });
            console.log("stripe-webhook: confirmation email sent for order", orderId);
          } catch (emailError) {
            console.error("stripe-webhook: failed to send confirmation email", emailError);
            // Don't fail the webhook if email fails
          }
        } else {
          console.warn("stripe-webhook: missing order_id on payment_intent.succeeded");
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        console.log(
          "stripe-webhook: payment_intent.payment_failed",
          JSON.stringify({
            paymentIntentId: pi.id,
            orderId,
            status: pi.status,
          }),
        );
        if (orderId) {
          await updateOrderStatus(orderId, "failed", "pending");
          
          // Send payment failed email
          try {
            await supabase.functions.invoke("send-order-email", {
              body: { orderId, emailType: "status_update" },
            });
          } catch (emailError) {
            console.error("stripe-webhook: failed to send failure email", emailError);
          }
        } else {
          console.warn("stripe-webhook: missing order_id on payment_intent.payment_failed");
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.order_id;
        console.log(
          "stripe-webhook: charge.refunded",
          JSON.stringify({
            chargeId: charge.id,
            orderId,
            refunded: charge.refunded,
          }),
        );
        if (orderId) {
          await updateOrderStatus(orderId, "refunded", "cancelled");
        } else {
          console.warn("stripe-webhook: missing order_id on charge.refunded");
        }
        break;
      }
      default:
        console.log("stripe-webhook: ignoring event type", event.type);
        break;
    }
  } catch (error) {
    console.error("stripe-webhook: error handling webhook", error);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

