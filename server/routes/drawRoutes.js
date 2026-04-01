const express = require("express");
const { getDraws, runDraw, simulateDraw } = require("../controllers/drawController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { drawRunSchema, drawSimulationSchema } = require("../validation/schemas");

const router = express.Router();

const normalizeDrawPayload = (req, res, next) => {
	if (typeof req.body === "string" || typeof req.body === "number") {
		req.body = { drawType: String(req.body) };
	}

	return next();
};

router.get("/draws", requireAuth, getDraws);
router.post(
	"/draw/simulate",
	requireAdmin,
	normalizeDrawPayload,
	validateBody(drawSimulationSchema),
	simulateDraw,
);
router.post(
	"/draw/run",
	requireAdmin,
	normalizeDrawPayload,
	validateBody(drawRunSchema),
	runDraw,
);

module.exports = router;