const supabase = require("../config/supabase");

const getMySubscription = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        return res.status(500).json({ error: "Subscriptions table is not initialized" });
      }

      console.error("Error fetching subscription:", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }

    return res.status(200).json({
      subscription: data || null,
    });
  } catch (err) {
    console.error("Unexpected error in getMySubscription:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateMySubscription = async (req, res) => {
  try {
    const { action, plan } = req.body;

    if (!["renew", "cancel"].includes(action)) {
      return res.status(400).json({ error: "action must be renew or cancel" });
    }

    if (action === "renew" && !["monthly", "yearly"].includes(plan)) {
      return res.status(400).json({ error: "plan must be monthly or yearly" });
    }

    const now = new Date();
    const endDate = new Date(now);
    if (action === "renew") {
      endDate.setMonth(endDate.getMonth() + (plan === "yearly" ? 12 : 1));
    }

    const payload = {
      user_id: req.user.id,
      plan: action === "renew" ? plan : null,
      status: action === "renew" ? "active" : "canceled",
      start_date: action === "renew" ? now.toISOString() : null,
      end_date: action === "renew" ? endDate.toISOString() : null,
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      if (error.code === "42P01") {
        return res.status(500).json({ error: "Subscriptions table is not initialized" });
      }

      console.error("Error updating subscription:", error);
      return res.status(500).json({ error: "Failed to update subscription" });
    }

    return res.status(200).json({
      message: action === "renew" ? "Subscription renewed" : "Subscription canceled",
      subscription: data,
    });
  } catch (err) {
    console.error("Unexpected error in updateMySubscription:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getMySubscription,
  updateMySubscription,
};
