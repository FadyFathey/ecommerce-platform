// Supabase Edge Function: create-payment-intent
// Validates cart server-side, creates order via RPC, then creates a Stripe PaymentIntent

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// NOTE: This must be configured as SERVICE_ROLE_KEY in the Supabase Dashboard env vars.
// The README may still reference SUPABASE_SERVICE_ROLE_KEY, but this function expects SERVICE_ROLE_KEY.
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "create-payment-intent: Missing required env vars",
    JSON.stringify({
      hasStripeSecret: !!STRIPE_SECRET_KEY,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRoleKey: !!SERVICE_ROLE_KEY,
    }),
  );
  throw new Error("Missing STRIPE_SECRET_KEY or Supabase env vars");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Basic CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CartItemInput = {
  product_id: string;
  quantity: number;
};

serve(async (req) => {
  console.log(
    "create-payment-intent: incoming request",
    JSON.stringify({
      method: req.method,
      origin: req.headers.get("origin"),
    }),
  );

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      console.log("create-payment-intent: handling CORS preflight");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      console.warn("create-payment-intent: invalid method", req.method);
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      console.warn("create-payment-intent: missing bearer token");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    const accessToken = authHeader.replace(/bearer /i, "").trim();
    if (!accessToken) {
      console.warn("create-payment-intent: empty bearer token");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const items = (body?.items || []) as CartItemInput[];
    const currency = (body?.currency as string) || "USD";
    const shipping_cents = Number.isFinite(body?.shipping_cents) ? body.shipping_cents : 0;

    console.log(
      "create-payment-intent: parsed body",
      JSON.stringify({
        itemsCount: items.length,
        currency,
        shipping_cents,
      }),
    );

    if (!Array.isArray(items) || items.length === 0) {
      console.warn("create-payment-intent: no items provided");
      return new Response(JSON.stringify({ error: "No items provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Supabase client with user context (via Authorization) and service role key
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    // Validate user
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      console.warn(
        "create-payment-intent: failed to get user",
        JSON.stringify({ error: userError?.message }),
      );
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create order and items via secure RPC (recalculates price/stock server-side)
    console.log(
      "create-payment-intent: calling create_order_with_items",
      JSON.stringify({
        userId: userData.user.id,
        itemsCount: items.length,
        currency,
        shipping_cents,
      }),
    );

    const { data: orderData, error: orderError } = await supabase.rpc("create_order_with_items", {
      order_input: { items, currency, shipping_cents },
    });

    if (orderError) {
      console.error(
        "create-payment-intent: create_order_with_items failed",
        JSON.stringify({ message: orderError.message, details: orderError.details }),
      );
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const orderRowRaw = Array.isArray(orderData) ? orderData[0] : orderData;
    const orderRow = {
      id: orderRowRaw?.id ?? orderRowRaw?.order_id,
      total_cents: orderRowRaw?.total_cents,
      currency: orderRowRaw?.currency,
    };

    console.log(
      "create-payment-intent: order created",
      JSON.stringify({
        rawOrder: orderData,
        normalized: {
          id: orderRow.id,
          total_cents: orderRow.total_cents,
          currency: orderRow.currency,
        },
      }),
    );
    if (!orderRow.id || !orderRow.total_cents) {
      console.error(
        "create-payment-intent: invalid order response",
        JSON.stringify({ raw: orderRowRaw, normalized: orderRow }),
      );
      return new Response(JSON.stringify({ error: "Invalid order response" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: orderRow.total_cents,
      currency: orderRow.currency || currency,
      metadata: {
        order_id: orderRow.id,
        user_id: userData.user.id,
      },
    });

    console.log(
      "create-payment-intent: payment intent created",
      JSON.stringify({
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      }),
    );

    // Persist payment_intent_id and payment_status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_intent_id: paymentIntent.id, payment_status: "requires_action" })
      .eq("id", orderRow.id);

    if (updateError) {
      console.error(
        "create-payment-intent: failed to update order with payment_intent_id",
        JSON.stringify({ message: updateError.message, details: updateError.details }),
      );
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const responsePayload = {
      clientSecret: paymentIntent.client_secret,
      orderId: orderRow.id,
      amount: orderRow.total_cents,
      currency: orderRow.currency || currency,
    };

    console.log("create-payment-intent: success response", JSON.stringify(responsePayload));

    return new Response(
      JSON.stringify({
        ...responsePayload,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("create-payment-intent: unhandled error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

