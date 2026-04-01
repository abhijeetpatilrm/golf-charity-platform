const express = require("express");
const { getMonthlyPrizePoolSummary } = require("../controllers/prizePoolController");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAdmin, getMonthlyPrizePoolSummary);

module.exports = router;
