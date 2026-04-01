const supabase = require("../config/supabase");

const generateUniqueDrawNumbers = () => {
  const numbers = new Set();

  while (numbers.size < 5) {
    const randomNumber = Math.floor(Math.random() * 45) + 1;
    numbers.add(randomNumber);
  }

  return Array.from(numbers).sort((a, b) => a - b);
};

const getMatchType = (matchCount) => {
  if (matchCount === 5) return "5";
  if (matchCount === 4) return "4";
  if (matchCount === 3) return "3";
  return null;
};

const countMatches = (drawNumbers, userScores) => {
  const drawSet = new Set(drawNumbers);
  const uniqueScoreSet = new Set(userScores);

  let matches = 0;
  uniqueScoreSet.forEach((score) => {
    if (drawSet.has(score)) {
      matches += 1;
    }
  });

  return matches;
};

const runDraw = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const drawNumbers = generateUniqueDrawNumbers();

    const { data: draw, error: drawInsertError } = await supabase
      .from("draws")
      .insert({
        month,
        year,
        numbers: drawNumbers,
        status: "published",
      })
      .select("id, month, year, numbers, status")
      .single();

    if (drawInsertError) {
      console.error("Error creating draw:", drawInsertError);
      return res.status(500).json({ error: "Failed to create monthly draw" });
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    const winnersToInsert = [];

    for (const user of users) {
      const { data: latestScores, error: scoresError } = await supabase
        .from("scores")
        .select("score, date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      if (scoresError) {
        console.error(`Error fetching scores for user ${user.id}:`, scoresError);
        return res.status(500).json({ error: "Failed to fetch user scores" });
      }

      if (!latestScores || latestScores.length === 0) {
        continue;
      }

      const scoreValues = latestScores
        .map((entry) => Number(entry.score))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 45);

      const matchCount = countMatches(drawNumbers, scoreValues);
      const matchType = getMatchType(matchCount);

      if (!matchType) {
        continue;
      }

      winnersToInsert.push({
        user_id: user.id,
        draw_id: draw.id,
        match_type: matchType,
        prize_amount: 0,
        status: "pending",
      });
    }

    if (winnersToInsert.length > 0) {
      const { error: winnersInsertError } = await supabase
        .from("winners")
        .insert(winnersToInsert);

      if (winnersInsertError) {
        console.error("Error inserting winners:", winnersInsertError);
        return res.status(500).json({ error: "Failed to save winners" });
      }
    }

    return res.status(201).json({
      drawNumbers,
      totalWinners: winnersToInsert.length,
    });
  } catch (err) {
    console.error("Unexpected error in runDraw:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  runDraw,
};
