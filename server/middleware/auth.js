const supabase = require("../config/supabase");
const env = require("../config/env");

const getBearerToken = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice(7).trim();
};

const canUseDevBypass = () => {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS !== "false";
};

const attachDevUserIfAllowed = (req) => {
  if (!canUseDevBypass()) {
    return false;
  }

  req.user = {
    id: process.env.DEV_USER_ID || "00000000-0000-0000-0000-000000000001",
    email: process.env.DEV_USER_EMAIL || "dev-admin@example.com",
    role: (process.env.DEV_USER_ROLE || "admin").toLowerCase(),
  };

  return true;
};

const attachUserContext = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization || "");

    if (!token) {
      return next();
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return next();
    }

    const user = data.user;
    req.user = {
      id: user.id,
      email: user.email || null,
      role: (user.user_metadata?.role || "subscriber").toLowerCase(),
    };

    return next();
  } catch (err) {
    console.error("Failed to attach user context:", err);
    return next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user?.id && attachDevUserIfAllowed(req)) {
    return next();
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  return next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user?.id && attachDevUserIfAllowed(req)) {
    return next();
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  if (roles.includes("admin") || roles.includes("administrator")) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Server misconfiguration: service role key missing for admin operations",
      });
    }
  }

  return next();
};

const requireAdmin = requireRole("admin", "administrator");

module.exports = {
  attachUserContext,
  requireAuth,
  requireRole,
  requireAdmin,
};
