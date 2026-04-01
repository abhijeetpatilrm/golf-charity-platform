const express = require("express");
const {
	getCharities,
	getCharityProfile,
	getCharityImpactSummary,
	createCharity,
	updateCharity,
	deleteCharity,
} = require("../controllers/charityController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validateBody, validateParams } = require("../middleware/validate");
const {
	charityCreateSchema,
	charityUpdateSchema,
	resourceIdParamSchema,
} = require("../validation/schemas");

const router = express.Router();

router.get("/", requireAuth, getCharities);
router.get("/impact/summary", requireAuth, getCharityImpactSummary);
router.get("/:id", requireAuth, validateParams(resourceIdParamSchema), getCharityProfile);
router.post("/", requireAdmin, validateBody(charityCreateSchema), createCharity);
router.patch("/:id", requireAdmin, validateParams(resourceIdParamSchema), validateBody(charityUpdateSchema), updateCharity);
router.delete("/:id", requireAdmin, validateParams(resourceIdParamSchema), deleteCharity);

module.exports = router;
