const express = require("express");
const { addScore } = require("../controllers/scoreController");

const router = express.Router();

router.post("/scores", addScore);

module.exports = router;
