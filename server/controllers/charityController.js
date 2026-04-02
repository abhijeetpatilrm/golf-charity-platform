const supabase = require("../config/supabaseAdmin");

const DEFAULT_CHARITIES = [
  {
    name: "Fairway Youth Foundation",
    description: "Grassroots youth golf development and mentoring.",
    website_url: "https://example.org/fairway-youth",
    is_active: true,
  },
  {
    name: "Green Relief Initiative",
    description: "Community environmental restoration and clean water projects.",
    website_url: "https://example.org/green-relief",
    is_active: true,
  },
  {
    name: "Urban Sports Access",
    description: "Inclusive sports programs for underserved communities.",
    website_url: "https://example.org/urban-sports",
    is_active: true,
  },
];

const canSeedDevCharities = () => {
  return process.env.ALLOW_DEV_AUTH_BYPASS !== "false";
};

const seedDefaultCharitiesIfNeeded = async () => {
  if (!canSeedDevCharities()) {
    return;
  }

  const { data: existingCharities, error: existingError } = await supabase
    .from("charities")
    .select("id")
    .limit(1);

  if (existingError) {
    return;
  }

  if ((existingCharities || []).length > 0) {
    return;
  }

  const { error: seedError } = await supabase.from("charities").insert(DEFAULT_CHARITIES);

  if (seedError && seedError.code !== "42P01") {
    console.error("Failed to seed default charities:", seedError);
  }
};

const getCharities = async (req, res) => {
  try {
    await seedDefaultCharitiesIfNeeded();

    const search = String(req.query.search || "").trim().toLowerCase();
    const status = String(req.query.status || "all").toLowerCase();

    const { data: charities, error } = await supabase
      .from("charities")
      .select("*");

    if (error) {
      if (error.code === "42P01") {
        return res.status(200).json({ charities: [] });
      }

      console.error("Error fetching charities:", error);
      return res.status(500).json({ error: "Failed to fetch charities" });
    }

    const normalizedCharities = (charities || []).map((charity) => ({
      id: charity.id,
      name: charity.name || "Unnamed Charity",
      description: charity.description || null,
      website_url: charity.website_url || charity.website || null,
      logo_url: charity.logo_url || null,
      is_active: charity.is_active ?? true,
      created_at: charity.created_at || null,
    }));

    const filtered = normalizedCharities.filter((charity) => {
      const matchesSearch =
        !search ||
        charity.name.toLowerCase().includes(search) ||
        String(charity.description || "").toLowerCase().includes(search);
      const matchesStatus =
        status === "all" ||
        (status === "active" && charity.is_active) ||
        (status === "inactive" && !charity.is_active);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    return res.status(200).json({ charities: filtered });
  } catch (err) {
    console.error("Unexpected error in getCharities:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCharityProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (charityError) {
      console.error("Error fetching charity profile:", charityError);
      return res.status(500).json({ error: "Failed to fetch charity profile" });
    }

    if (!charity) {
      return res.status(404).json({ error: "Charity not found" });
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from("user_charity_preferences")
      .select("user_id, contribution_percent")
      .eq("charity_id", id);

    if (preferencesError && preferencesError.code !== "42P01") {
      console.error("Error fetching charity preferences:", preferencesError);
      return res.status(500).json({ error: "Failed to fetch charity profile" });
    }

    const selectedUsers = preferences || [];
    const averageContributionPercent = selectedUsers.length
      ? Math.round(
          (selectedUsers.reduce((sum, row) => sum + Number(row.contribution_percent || 0), 0) /
            selectedUsers.length) *
            100,
        ) / 100
      : 0;

    return res.status(200).json({
      charity,
      profile: {
        selectedUsers: selectedUsers.length,
        averageContributionPercent,
      },
    });
  } catch (err) {
    console.error("Unexpected error in getCharityProfile:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCharityImpactSummary = async (req, res) => {
  try {
    const { data: charities, error: charitiesError } = await supabase
      .from("charities")
      .select("id, name, is_active");

    if (charitiesError) {
      console.error("Error fetching charities for impact:", charitiesError);
      return res.status(500).json({ error: "Failed to fetch impact summary" });
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from("user_charity_preferences")
      .select("charity_id, contribution_percent");

    if (preferencesError && preferencesError.code !== "42P01") {
      console.error("Error fetching preferences for impact:", preferencesError);
      return res.status(500).json({ error: "Failed to fetch impact summary" });
    }

    const unitContribution = Number(process.env.PRIZE_POOL_PER_SUBSCRIBER || 10);
    const impactRows = (charities || []).map((charity) => {
      const rows = (preferences || []).filter((pref) => pref.charity_id === charity.id);
      const supporters = rows.length;
      const monthlyEstimatedImpact = rows.reduce(
        (sum, row) => sum + (unitContribution * Number(row.contribution_percent || 10)) / 100,
        0,
      );

      return {
        charity_id: charity.id,
        charity_name: charity.name,
        is_active: charity.is_active !== false,
        supporters,
        monthlyEstimatedImpact: Math.round(monthlyEstimatedImpact * 100) / 100,
      };
    });

    return res.status(200).json({
      totalSupporters: impactRows.reduce((sum, row) => sum + row.supporters, 0),
      totalMonthlyEstimatedImpact:
        Math.round(
          impactRows.reduce((sum, row) => sum + Number(row.monthlyEstimatedImpact || 0), 0) * 100,
        ) / 100,
      charities: impactRows,
    });
  } catch (err) {
    console.error("Unexpected error in getCharityImpactSummary:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createCharity = async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      description: req.body.description || null,
      website_url: req.body.website_url || null,
      logo_url: req.body.logo_url || null,
      is_active: req.body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("charities")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating charity:", error);
      return res.status(500).json({ error: "Failed to create charity" });
    }

    return res.status(201).json({ message: "Charity created", charity: data });
  } catch (err) {
    console.error("Unexpected error in createCharity:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { updated_at: new Date().toISOString() };

    ["name", "description", "website_url", "logo_url", "is_active"].forEach((key) => {
      if (req.body[key] !== undefined) {
        payload[key] = req.body[key];
      }
    });

    const { data, error } = await supabase
      .from("charities")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error updating charity:", error);
      return res.status(500).json({ error: "Failed to update charity" });
    }

    if (!data) {
      return res.status(404).json({ error: "Charity not found" });
    }

    return res.status(200).json({ message: "Charity updated", charity: data });
  } catch (err) {
    console.error("Unexpected error in updateCharity:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("charities").delete().eq("id", id);

    if (error) {
      console.error("Error deleting charity:", error);
      return res.status(500).json({ error: "Failed to delete charity" });
    }

    return res.status(200).json({ message: "Charity deleted" });
  } catch (err) {
    console.error("Unexpected error in deleteCharity:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getCharities,
  getCharityProfile,
  getCharityImpactSummary,
  createCharity,
  updateCharity,
  deleteCharity,
};
