const express = require("express");
const { runDraw } = require("../controllers/drawController");

const router = express.Router();

router.post("/draw/run", runDraw);

module.exports = router;