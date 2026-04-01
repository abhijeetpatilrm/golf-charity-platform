const express = require("express");
const { getAdminOverview, getAdminReports } = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/overview", requireAdmin, getAdminOverview);
router.get("/reports", requireAdmin, getAdminReports);

module.exports = router;
