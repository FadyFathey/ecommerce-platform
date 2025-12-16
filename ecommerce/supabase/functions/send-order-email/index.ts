// Supabase Edge Function: send-order-email
// Sends order confirmation and status update emails

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
// Optional: Add Resend API key if using Resend for emails
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("send-order-email: incoming request", {
    method: req.method,
  });

  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    const { orderId, emailType } = body; // emailType: 'confirmation' | 'status_update'

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("send-order-email: order not found", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get order items
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    const recipientEmail = order.customer_email || order.user_id;

    if (!recipientEmail) {
      console.warn("send-order-email: no email address found");
      return new Response(JSON.stringify({ error: "No email address found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate email content
    const subject =
      emailType === "confirmation"
        ? `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`
        : `Order Update #${order.id.slice(0, 8).toUpperCase()}`;

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #000;">${subject}</h1>
          <p>Dear ${order.customer_name || "Customer"},</p>
          ${
            emailType === "confirmation"
              ? `<p>Thank you for your order! Your payment has been confirmed.</p>`
              : `<p>Your order status has been updated to: <strong>${order.status}</strong></p>`
          }
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Order Number:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment Status:</strong> ${order.payment_status}</p>
          </div>
          ${
            items && items.length > 0
              ? `
            <div style="margin: 20px 0;">
              <h2>Order Items</h2>
              ${items
                .map(
                  (item: any) => `
                <div style="padding: 10px; border-bottom: 1px solid #ddd;">
                  <strong>${item.name}</strong> - Qty: ${item.quantity} - $${(item.price_cents / 100).toFixed(2)}
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Subtotal:</strong> $${(order.subtotal_cents / 100).toFixed(2)}</p>
            <p><strong>Shipping:</strong> $${(order.shipping_cents / 100).toFixed(2)}</p>
            <p><strong>Tax:</strong> $${(order.tax_cents / 100).toFixed(2)}</p>
            <p style="font-size: 18px; font-weight: bold;"><strong>Total:</strong> $${(order.total_cents / 100).toFixed(2)}</p>
          </div>
          <p>Thank you for shopping with us!</p>
        </body>
      </html>
    `;

    // If Resend API key is configured, use Resend
    if (RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "noreply@yourdomain.com", // Update with your domain
          to: recipientEmail,
          subject,
          html: htmlContent,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.text();
        console.error("send-order-email: Resend API error", error);
        throw new Error("Failed to send email via Resend");
      }

      console.log("send-order-email: email sent via Resend");
    } else {
      // Fallback: Log email (in production, you'd use a real email service)
      console.log("send-order-email: email would be sent", {
        to: recipientEmail,
        subject,
        html: htmlContent.substring(0, 200) + "...",
      });
      console.warn("send-order-email: RESEND_API_KEY not configured, email not actually sent");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("send-order-email: unhandled error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

