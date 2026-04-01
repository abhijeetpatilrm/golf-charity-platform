const supabase = require("../config/supabase");

const isSubscriptionActive = (subscription) => {
  if (!subscription) {
    return false;
  }

  if (String(subscription.status || "").toLowerCase() !== "active") {
    return false;
  }

  if (!subscription.end_date) {
    return true;
  }

  return new Date(subscription.end_date).getTime() > Date.now();
};

const canBypassInDev = () => {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_SUBSCRIPTION_BYPASS !== "false"
  );
};

const requireActiveSubscription = async (req, res, next) => {
  try {
    if (canBypassInDev()) {
      return next();
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError && subscriptionError.code !== "42P01") {
      console.error("Error checking subscription:", subscriptionError);
      return res.status(500).json({ error: "Failed to validate subscription status" });
    }

    let active = isSubscriptionActive(subscription);

    if (!active) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("subscription_status")
        .eq("id", req.user.id)
        .maybeSingle();

      if (userError && userError.code !== "42P01") {
        console.error("Error checking user subscription fallback:", userError);
        return res.status(500).json({ error: "Failed to validate subscription status" });
      }

      active = String(user?.subscription_status || "").toLowerCase() === "active";
    }

    if (!active) {
      return res.status(403).json({
        error: "Active subscription required",
      });
    }

    return next();
  } catch (err) {
    console.error("Unexpected error in requireActiveSubscription:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  requireActiveSubscription,
};
