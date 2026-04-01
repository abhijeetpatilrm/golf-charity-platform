const express = require("express");
const {
  submitWinnerVerification,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} = require("../controllers/verificationController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");
const { validateBody, validateParams } = require("../middleware/validate");
const { verificationSubmitSchema, resourceIdParamSchema } = require("../validation/schemas");

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  validateBody(verificationSubmitSchema),
  submitWinnerVerification,
);
router.get("/pending", requireAdmin, getPendingVerifications);
router.patch("/:id/approve", requireAdmin, validateParams(resourceIdParamSchema), approveVerification);
router.patch("/:id/reject", requireAdmin, validateParams(resourceIdParamSchema), rejectVerification);

module.exports = router;
