const express = require("express");
const {
  getMyCharityPreference,
  upsertMyCharityPreference,
} = require("../controllers/preferenceController");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { charityPreferenceSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/me", requireAuth, getMyCharityPreference);
router.put("/me", requireAuth, validateBody(charityPreferenceSchema), upsertMyCharityPreference);

module.exports = router;
