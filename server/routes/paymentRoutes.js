const express = require("express");
const {
  createSubscriptionCheckoutSession,
  handlePaymentWebhook,
} = require("../controllers/paymentController");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { checkoutSessionSchema, webhookEventSchema } = require("../validation/schemas");

const router = express.Router();

router.post(
  "/checkout-session",
  requireAuth,
  validateBody(checkoutSessionSchema),
  createSubscriptionCheckoutSession,
);
router.post("/webhook", validateBody(webhookEventSchema), handlePaymentWebhook);

module.exports = router;
