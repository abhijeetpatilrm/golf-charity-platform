const supabase = require("../config/supabase");

const resolveActiveUserId = async (req) => {
  if (!req.user?.id) {
    return {
      status: 401,
      error: "Authentication required",
    };
  }

  return { userId: req.user.id };
};

const getScores = async (req, res) => {
  try {
    const activeUser = await resolveActiveUserId(req);
    if (!activeUser.userId) {
      return res.status(activeUser.status).json({ error: activeUser.error });
    }

    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("id, score, date")
      .eq("user_id", activeUser.userId)
      .order("date", { ascending: false });

    if (scoresError) {
      console.error("Error fetching scores:", scoresError);
      return res.status(500).json({ error: "Failed to fetch scores" });
    }

    return res.status(200).json({ scores });
  } catch (err) {
    console.error("Unexpected error in getScores:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

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

    const activeUser = await resolveActiveUserId(req);
    if (!activeUser.userId) {
      return res.status(activeUser.status).json({ error: activeUser.error });
    }

    const { data: existingScores, error: fetchError } = await supabase
      .from("scores")
      .select("id, score, date")
      .eq("user_id", activeUser.userId)
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
        user_id: activeUser.userId,
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

const updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, date } = req.body;

    const activeUser = await resolveActiveUserId(req);
    if (!activeUser.userId) {
      return res.status(activeUser.status).json({ error: activeUser.error });
    }

    const { data: existingScore, error: findError } = await supabase
      .from("scores")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("Error finding score:", findError);
      return res.status(500).json({ error: "Failed to find score" });
    }

    if (!existingScore || existingScore.user_id !== activeUser.userId) {
      return res.status(404).json({ error: "Score not found" });
    }

    const { data: updatedScore, error: updateError } = await supabase
      .from("scores")
      .update({ score: Number(score), date })
      .eq("id", id)
      .select("id, user_id, score, date")
      .single();

    if (updateError) {
      console.error("Error updating score:", updateError);
      return res.status(500).json({ error: "Failed to update score" });
    }

    return res.status(200).json({
      message: "Score updated successfully",
      score: updatedScore,
    });
  } catch (err) {
    console.error("Unexpected error in updateScore:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getScores,
  addScore,
  updateScore,
};
