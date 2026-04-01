const supabase = require("../config/supabase");
const { createCheckoutSession, parseWebhookEvent } = require("../services/paymentGateway");

const PLAN_PRICING = {
  monthly: 29,
  yearly: 299,
};

const createSubscriptionCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!Object.keys(PLAN_PRICING).includes(plan)) {
      return res.status(400).json({ error: "plan must be monthly or yearly" });
    }

    const amount = PLAN_PRICING[plan];
    const session = await createCheckoutSession({
      userId: req.user.id,
      plan,
      amount,
      currency: "USD",
    });

    const { error } = await supabase.from("payment_intents").insert({
      user_id: req.user.id,
      plan,
      amount,
      currency: "USD",
      provider: session.provider,
      provider_session_id: session.sessionId,
      status: "pending",
    });

    if (error) {
      console.error("Error storing payment intent:", error);
    }

    return res.status(201).json({
      message: "Checkout session created",
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      amount,
      currency: "USD",
      plan,
    });
  } catch (err) {
    console.error("Unexpected error in createSubscriptionCheckoutSession:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const handlePaymentWebhook = async (req, res) => {
  try {
    const event = parseWebhookEvent(req.body || {});

    if (event.type === "payment.succeeded") {
      const userId = event.data?.userId;
      const plan = event.data?.plan;

      if (userId && ["monthly", "yearly"].includes(plan)) {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + (plan === "yearly" ? 12 : 1));

        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (error && error.code !== "42P01") {
          console.error("Error updating subscription from webhook:", error);
        }
      }
    }

    return res.status(200).json({
      received: true,
      eventType: event.type,
      eventId: event.id,
    });
  } catch (err) {
    console.error("Unexpected error in handlePaymentWebhook:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createSubscriptionCheckoutSession,
  handlePaymentWebhook,
};
