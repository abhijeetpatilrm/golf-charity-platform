const supabase = require("../config/supabaseAdmin");

const generateUniqueDrawNumbers = () => {
  const numbers = new Set();

  while (numbers.size < 5) {
    const randomNumber = Math.floor(Math.random() * 45) + 1;
    numbers.add(randomNumber);
  }

  return Array.from(numbers).sort((a, b) => a - b);
};

const generateAlgorithmicDrawNumbers = async () => {
  const { data: scoreRows, error } = await supabase
    .from("scores")
    .select("score")
    .order("date", { ascending: false })
    .limit(500);

  if (error || !scoreRows || scoreRows.length === 0) {
    return generateUniqueDrawNumbers();
  }

  const frequency = scoreRows.reduce((acc, row) => {
    const score = Number(row.score);
    if (Number.isInteger(score) && score >= 1 && score <= 45) {
      acc[score] = (acc[score] || 0) + 1;
    }
    return acc;
  }, {});

  const topNumbers = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([score]) => Number(score));

  if (topNumbers.length < 5) {
    return generateUniqueDrawNumbers();
  }

  return topNumbers.sort((a, b) => a - b);
};

const resolveDrawNumbers = async (mode = "random") => {
  if (mode === "algorithmic") {
    return generateAlgorithmicDrawNumbers();
  }

  return generateUniqueDrawNumbers();
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

const resolveDrawConfig = (input = {}) => {
  const drawType = ["3", "4", "5"].includes(input.drawType)
    ? input.drawType
    : "5";
  const mode = ["random", "algorithmic"].includes(input.mode)
    ? input.mode
    : "random";

  return { drawType, mode };
};

const getPreviousMonthPeriod = (month, year) => {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }

  return { month: month - 1, year };
};

const calculateRolloverCarry = async (month, year) => {
  try {
    const previous = getPreviousMonthPeriod(month, year);

    const { data: previousDraw, error: drawError } = await supabase
      .from("draws")
      .select("id")
      .eq("month", previous.month)
      .eq("year", previous.year)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (drawError || !previousDraw) {
      return 0;
    }

    const { data: previousTier5, error: winnersError } = await supabase
      .from("winners")
      .select("id")
      .eq("draw_id", previousDraw.id)
      .eq("match_type", "5")
      .limit(1);

    if (winnersError || (previousTier5 || []).length > 0) {
      return 0;
    }

    const { data: activeSubscriptions, error: subscriptionsError } =
      await supabase.from("subscriptions").select("id").eq("status", "active");

    if (subscriptionsError) {
      return 0;
    }

    const subscribersCount = (activeSubscriptions || []).length;
    const unitContribution = Number(
      process.env.PRIZE_POOL_PER_SUBSCRIBER || 10,
    );
    const totalPrizePool = subscribersCount * unitContribution;
    return Math.round(totalPrizePool * 0.4 * 100) / 100;
  } catch {
    return 0;
  }
};

const runDrawCore = async ({ drawType, mode, month, year }) => {
  const drawNumbers = await resolveDrawNumbers(mode);

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
    throw new Error("Failed to create monthly draw");
  }

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id");
  if (usersError) {
    await supabase.from("draws").delete().eq("id", draw.id);
    throw new Error("Failed to fetch users");
  }

  const winnersToInsert = [];

  for (const user of users || []) {
    const { data: latestScores, error: scoresError } = await supabase
      .from("scores")
      .select("score, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(5);

    if (scoresError) {
      await supabase.from("draws").delete().eq("id", draw.id);
      throw new Error("Failed to fetch user scores");
    }

    if (!latestScores || latestScores.length === 0) {
      continue;
    }

    const scoreValues = latestScores
      .map((entry) => Number(entry.score))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 45);

    const matchCount = countMatches(drawNumbers, scoreValues);
    const matchType = getMatchType(matchCount);

    if (!matchType || Number(matchType) < Number(drawType)) {
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
      await supabase.from("draws").delete().eq("id", draw.id);
      throw new Error("Failed to save winners");
    }
  }

  const jackpotRolloverCarried = await calculateRolloverCarry(month, year);

  return {
    draw,
    drawNumbers,
    winnersToInsert,
    jackpotRolloverCarried,
  };
};

const getDraws = async (req, res) => {
  try {
    const { data: draws, error: drawsError } = await supabase
      .from("draws")
      .select("id, month, year, numbers, status")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (drawsError) {
      console.error("Error fetching draws:", drawsError);
      return res.status(500).json({ error: "Failed to fetch draws" });
    }

    return res.status(200).json({ draws });
  } catch (err) {
    console.error("Unexpected error in getDraws:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const runDraw = async (req, res) => {
  try {
    const { drawType, mode } = resolveDrawConfig(req.body || {});

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const { draw, drawNumbers, winnersToInsert, jackpotRolloverCarried } =
      await runDrawCore({ drawType, mode, month, year });

    return res.status(201).json({
      draw,
      drawType,
      mode,
      drawNumbers,
      totalWinners: winnersToInsert.length,
      jackpotRolloverCarried,
    });
  } catch (err) {
    console.error("Unexpected error in runDraw:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const simulateDraw = async (req, res) => {
  try {
    const { drawType, mode } = resolveDrawConfig(req.body || {});

    const drawNumbers = await resolveDrawNumbers(mode);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id");
    if (usersError) {
      console.error("Error fetching users for simulation:", usersError);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    let projectedWinners = 0;

    for (const user of users || []) {
      const { data: latestScores, error: scoresError } = await supabase
        .from("scores")
        .select("score")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      if (scoresError || !latestScores?.length) {
        continue;
      }

      const scoreValues = latestScores
        .map((entry) => Number(entry.score))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 45);

      const matchCount = countMatches(drawNumbers, scoreValues);
      const matchType = getMatchType(matchCount);
      if (matchType && Number(matchType) >= Number(drawType)) {
        projectedWinners += 1;
      }
    }

    return res.status(200).json({
      simulation: {
        drawType,
        mode,
        drawNumbers,
        projectedWinners,
      },
    });
  } catch (err) {
    console.error("Unexpected error in simulateDraw:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getDraws,
  runDraw,
  runDrawCore,
  simulateDraw,
};
