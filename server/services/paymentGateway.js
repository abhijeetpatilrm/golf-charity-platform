const createCheckoutSession = async ({ userId, plan, amount, currency }) => {
  // Provider abstraction point: replace with Stripe/Adyen implementation later.
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const checkoutUrl = `https://payments.example.com/checkout/${sessionId}`;

  return {
    provider: "mock-gateway",
    sessionId,
    checkoutUrl,
    metadata: {
      userId,
      plan,
      amount,
      currency,
    },
  };
};

const parseWebhookEvent = (payload) => {
  // Provider abstraction point: verify signature + parse event body for a real gateway.
  return {
    id: payload?.id || `evt_${Date.now()}`,
    type: payload?.type || "payment.succeeded",
    data: payload?.data || {},
  };
};

module.exports = {
  createCheckoutSession,
  parseWebhookEvent,
};
