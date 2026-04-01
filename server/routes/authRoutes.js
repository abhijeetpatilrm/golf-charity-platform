const express = require("express");
const { signUp, signIn, getMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { signUpSchema, signInSchema } = require("../validation/schemas");

const router = express.Router();

router.post("/signup", validateBody(signUpSchema), signUp);
router.post("/login", validateBody(signInSchema), signIn);
router.get("/me", requireAuth, getMe);

module.exports = router;
