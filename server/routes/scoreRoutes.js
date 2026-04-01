const express = require("express");
const { addScore, getScores, updateScore } = require("../controllers/scoreController");
const { requireAuth } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");
const { validateBody, validateParams } = require("../middleware/validate");
const { scoreCreateSchema, resourceIdParamSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/scores", requireAuth, requireActiveSubscription, getScores);
router.post(
	"/scores",
	requireAuth,
	requireActiveSubscription,
	validateBody(scoreCreateSchema),
	addScore,
);
router.patch(
	"/scores/:id",
	requireAuth,
	requireActiveSubscription,
	validateParams(resourceIdParamSchema),
	validateBody(scoreCreateSchema),
	updateScore,
);

module.exports = router;
