const supabase = require("../config/supabase");

const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";

const addScore = async (req, res) => {
  try {
    const { score, date } = req.body;

    if (score === undefined || score === null || Number.isNaN(Number(score))) {
      return res
        .status(400)
        .json({ error: "score is required and must be a number" });
    }

    const numericScore = Number(score);
    if (numericScore < 1 || numericScore > 45) {
      return res.status(400).json({ error: "score must be between 1 and 45" });
    }

    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    let activeUserId = HARDCODED_USER_ID;

    const { data: hardcodedUser, error: userLookupError } = await supabase
      .from("users")
      .select("id")
      .eq("id", HARDCODED_USER_ID)
      .maybeSingle();

    if (userLookupError) {
      console.error("Error checking hardcoded user:", userLookupError);
      return res.status(500).json({ error: "Failed to validate user" });
    }

    if (!hardcodedUser) {
      const { data: firstUser, error: fallbackUserError } = await supabase
        .from("users")
        .select("id")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fallbackUserError) {
        console.error("Error fetching fallback user:", fallbackUserError);
        return res.status(500).json({ error: "Failed to fetch fallback user" });
      }

      if (!firstUser) {
        return res.status(400).json({
          error: "No user found. Add a user in 'users' table before adding scores.",
        });
      }

      activeUserId = firstUser.id;
    }

    const { data: existingScores, error: fetchError } = await supabase
      .from("scores")
      .select("id, score, date")
      .eq("user_id", activeUserId)
      .order("date", { ascending: true });

    if (fetchError) {
      console.error("Error fetching existing scores:", fetchError);
      return res.status(500).json({ error: "Failed to fetch existing scores" });
    }

    if (existingScores.length >= 5) {
      const oldestScore = existingScores[0];

      const { error: deleteError } = await supabase
        .from("scores")
        .delete()
        .eq("id", oldestScore.id);

      if (deleteError) {
        console.error("Error deleting oldest score:", deleteError);
        return res.status(500).json({ error: "Failed to rotate old scores" });
      }
    }

    const { data: insertedScore, error: insertError } = await supabase
      .from("scores")
      .insert({
        user_id: activeUserId,
        score: numericScore,
        date,
      })
      .select("id, user_id, score, date")
      .single();

    if (insertError) {
      console.error("Error inserting new score:", insertError);
      return res.status(500).json({ error: "Failed to add score" });
    }

    return res.status(201).json({
      message: "Score added successfully",
      score: insertedScore,
    });
  } catch (err) {
    console.error("Unexpected error in addScore:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addScore,
};
