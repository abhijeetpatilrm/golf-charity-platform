const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.status(200).send("API is running...");
});

// Handle invalid JSON payloads safely.
app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
		return res.status(400).json({ error: "Invalid JSON payload" });
	}

	return next(err);
});

app.use((req, res) => {
	res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
	console.error("Unhandled application error:", err);
	res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

