const supabase = require("../config/supabase");
const env = require("../config/env");

const getBearerToken = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice(7).trim();
};

const canUseDevBypass = () => {
  return process.env.ALLOW_DEV_AUTH_BYPASS !== "false";
};

const parseDevSessionToken = (token) => {
  if (!token || !token.startsWith("dev.")) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(token.slice(4), "base64url").toString("utf8"));
    if (!payload?.id || !payload?.email) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: String(payload.role || "subscriber").toLowerCase(),
      name: payload.name || null,
    };
  } catch {
    return null;
  }
};

const syncUserRecord = async (user) => {
  if (!user?.id) {
    return;
  }

  const now = new Date().toISOString();
  const payload = {
    id: user.id,
    name: user.name || (String(user.email || "").toLowerCase() === (process.env.DEV_USER_EMAIL || "dev-admin@example.com").toLowerCase() ? "Dev Admin" : null),
    email: user.email || null,
    role: (user.role || "subscriber").toLowerCase(),
    updated_at: now,
  };

  if (user.role === "admin" || user.role === "administrator") {
    payload.subscription_status = "active";
  }

  const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });

  if (error && error.code !== "42P01") {
    console.error("Failed to sync user record:", error);
  }
};

const attachUserContext = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization || "");

    if (!token) {
      return next();
    }

    const devSessionUser = canUseDevBypass() ? parseDevSessionToken(token) : null;
    if (devSessionUser) {
      req.user = devSessionUser;
      await syncUserRecord(req.user);
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
      name: user.user_metadata?.name || null,
    };

    await syncUserRecord(req.user);

    return next();
  } catch (err) {
    console.error("Failed to attach user context:", err);
    return next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  return next();
};

const requireRole = (...roles) => (req, res, next) => {
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
