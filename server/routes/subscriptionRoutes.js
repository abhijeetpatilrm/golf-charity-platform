const express = require("express");
const {
  getMySubscription,
  updateMySubscription,
} = require("../controllers/subscriptionController");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { subscriptionUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/me", requireAuth, getMySubscription);
router.patch("/me", requireAuth, validateBody(subscriptionUpdateSchema), updateMySubscription);

module.exports = router;
