const supabase = require("../config/supabase");

const getMyCharityPreference = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_charity_preferences")
      .select("id, charity_id, contribution_percent")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        return res.status(200).json({ preference: null });
      }

      console.error("Error fetching charity preference:", error);
      return res.status(500).json({ error: "Failed to fetch charity preference" });
    }

    if (!data) {
      return res.status(200).json({ preference: null });
    }

    return res.status(200).json({
      preference: {
        id: data.id,
        charity_id: data.charity_id,
        contribution_percent: Number(data.contribution_percent || 10),
      },
    });
  } catch (err) {
    console.error("Unexpected error in getMyCharityPreference:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const upsertMyCharityPreference = async (req, res) => {
  try {
    const { charityId, contributionPercent } = req.body;

    const payload = {
      user_id: req.user.id,
      charity_id: charityId,
      contribution_percent: contributionPercent,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_charity_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select("id, charity_id, contribution_percent")
      .single();

    if (error) {
      console.error("Error upserting charity preference:", error);
      return res.status(500).json({ error: "Failed to save charity preference" });
    }

    return res.status(200).json({
      message: "Charity preference saved",
      preference: {
        id: data.id,
        charity_id: data.charity_id,
        contribution_percent: Number(data.contribution_percent || contributionPercent),
      },
    });
  } catch (err) {
    console.error("Unexpected error in upsertMyCharityPreference:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getMyCharityPreference,
  upsertMyCharityPreference,
};
