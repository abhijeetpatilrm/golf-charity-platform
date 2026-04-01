const supabase = require("../config/supabaseAdmin");

const TIER_SPLITS = {
  "5": 0.4,
  "4": 0.35,
  "3": 0.25,
};

const getMonthlyPrizePoolSummary = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const { data: activeSubscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    if (subscriptionsError && subscriptionsError.code !== "42P01") {
      console.error("Error fetching active subscriptions:", subscriptionsError);
      return res.status(500).json({ error: "Failed to calculate prize pool" });
    }

    const subscribersCount = activeSubscriptions?.length || 0;
    const unitContribution = Number(process.env.PRIZE_POOL_PER_SUBSCRIBER || 10);
    const totalPrizePool = subscribersCount * unitContribution;

    const tierAmounts = {
      "5": Math.round(totalPrizePool * TIER_SPLITS["5"] * 100) / 100,
      "4": Math.round(totalPrizePool * TIER_SPLITS["4"] * 100) / 100,
      "3": Math.round(totalPrizePool * TIER_SPLITS["3"] * 100) / 100,
    };

    const { data: monthlyDraw, error: drawError } = await supabase
      .from("draws")
      .select("id")
      .eq("month", month)
      .eq("year", year)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (drawError && drawError.code !== "42P01") {
      console.error("Error fetching draw for prize pool:", drawError);
      return res.status(500).json({ error: "Failed to calculate prize pool" });
    }

    let winners = [];
    if (monthlyDraw?.id) {
      const { data: winnersData, error: winnersError } = await supabase
        .from("winners")
        .select("id, user_id, match_type, status")
        .eq("draw_id", monthlyDraw.id);

      if (winnersError && winnersError.code !== "42P01") {
        console.error("Error fetching winners for prize pool:", winnersError);
        return res.status(500).json({ error: "Failed to calculate prize pool" });
      }

      winners = winnersData || [];
    }

    const winnersByTier = {
      "5": winners.filter((winner) => winner.match_type === "5").length,
      "4": winners.filter((winner) => winner.match_type === "4").length,
      "3": winners.filter((winner) => winner.match_type === "3").length,
    };

    const payoutPerWinner = {
      "5": winnersByTier["5"] > 0 ? Math.round((tierAmounts["5"] / winnersByTier["5"]) * 100) / 100 : 0,
      "4": winnersByTier["4"] > 0 ? Math.round((tierAmounts["4"] / winnersByTier["4"]) * 100) / 100 : 0,
      "3": winnersByTier["3"] > 0 ? Math.round((tierAmounts["3"] / winnersByTier["3"]) * 100) / 100 : 0,
    };

    const jackpotRollover = winnersByTier["5"] === 0 ? tierAmounts["5"] : 0;

    return res.status(200).json({
      month,
      year,
      subscribersCount,
      unitContribution,
      totalPrizePool,
      tierSplits: {
        "5": 40,
        "4": 35,
        "3": 25,
      },
      tierAmounts,
      winnersByTier,
      payoutPerWinner,
      jackpotRollover,
      drawId: monthlyDraw?.id || null,
    });
  } catch (err) {
    console.error("Unexpected error in getMonthlyPrizePoolSummary:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getMonthlyPrizePoolSummary,
};
