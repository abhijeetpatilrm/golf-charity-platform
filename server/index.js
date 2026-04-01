const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const { attachRequestContext } = require("./middleware/requestContext");
const { logError } = require("./services/observability");

dotenv.config();

const supabase = require("./config/supabase");
const scoreRoutes = require("./routes/scoreRoutes");
const drawRoutes = require("./routes/drawRoutes");
const winnerRoutes = require("./routes/winnerRoutes");
const userRoutes = require("./routes/userRoutes");
const charityRoutes = require("./routes/charityRoutes");
const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const prizePoolRoutes = require("./routes/prizePoolRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { startDrawScheduler } = require("./services/drawScheduler");
const { attachUserContext } = require("./middleware/auth");

const app = express();
const PORT = env.PORT;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(attachRequestContext);
app.use(morgan(':method :url :status :res[content-length] - :response-time ms req_id=:req[x-request-id]'));
app.use(express.json({ limit: "100kb", strict: false }));
app.use(attachUserContext);
app.use("/api", apiLimiter);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "golf-charity-platform-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/dependencies", async (req, res) => {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error && error.code !== "42P01") {
      return res.status(503).json({
        status: "degraded",
        supabase: "down",
        error: "Database dependency check failed",
      });
    }

    return res.status(200).json({
      status: "ok",
      supabase: "up",
    });
  } catch (err) {
    logError("Dependency health check failed", { error: err.message });
    return res.status(503).json({
      status: "degraded",
      supabase: "down",
      error: "Dependency check error",
    });
  }
});

// Test DB connection route
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Database query failed" });
    }

    return res.status(200).json(data);
  } catch (err) {
    logError("Unexpected test-db error", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api", scoreRoutes);
app.use("/api", drawRoutes);
app.use("/api/winners", winnerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/prize-pool", prizePoolRoutes);
app.use("/api/verifications", verificationRoutes);
app.use("/api/charity-preferences", preferenceRoutes);
app.use("/api/admin", adminRoutes);

// Handle invalid JSON payloads safely
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  return next(err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  logError("Unhandled application error", {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    error: err.message,
  });
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startDrawScheduler();
});
