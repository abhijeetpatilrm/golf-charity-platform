const express = require("express");
const { getUsers, updateUser } = require("../controllers/userController");
const { requireAdmin } = require("../middleware/auth");
const { validateBody, validateParams } = require("../middleware/validate");
const { resourceIdParamSchema, userUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", requireAdmin, getUsers);
router.patch("/:id", requireAdmin, validateParams(resourceIdParamSchema), validateBody(userUpdateSchema), updateUser);

module.exports = router;
