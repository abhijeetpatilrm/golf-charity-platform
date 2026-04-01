const express = require("express");
const {
  getWinners,
  getMyWinnings,
  getPayoutRecords,
  getWinnerAuditLogs,
  approveWinner,
  rejectWinner,
  payWinner,
} = require("../controllers/winnerController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validateParams } = require("../middleware/validate");
const { resourceIdParamSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/me", requireAuth, getMyWinnings);
router.get("/payout-records", requireAdmin, getPayoutRecords);
router.get("/audit-logs", requireAdmin, getWinnerAuditLogs);
router.get("/", requireAdmin, getWinners);
router.patch("/:id/approve", requireAdmin, validateParams(resourceIdParamSchema), approveWinner);
router.patch("/:id/reject", requireAdmin, validateParams(resourceIdParamSchema), rejectWinner);
router.patch("/:id/pay", requireAdmin, validateParams(resourceIdParamSchema), payWinner);

module.exports = router;
