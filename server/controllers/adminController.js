const supabase = require("../config/supabaseAdmin");

const getAdminOverview = async (req, res) => {
  try {
    const [usersResult, drawsResult, winnersResult, charitiesResult, subscriptionsResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("draws").select("id", { count: "exact", head: true }),
      supabase.from("winners").select("id,status,prize_amount"),
      supabase.from("charities").select("id,is_active"),
      supabase.from("subscriptions").select("id,status,plan"),
    ]);

    const winners = winnersResult.data || [];
    const charities = charitiesResult.data || [];
    const subscriptions = subscriptionsResult.data || [];

    const payoutCommitted = winners
      .filter((winner) => ["approved", "paid"].includes(String(winner.status || "").toLowerCase()))
      .reduce((sum, winner) => sum + Number(winner.prize_amount || 0), 0);

    const activeSubscriptions = subscriptions.filter(
      (row) => String(row.status || "").toLowerCase() === "active",
    ).length;

    return res.status(200).json({
      metrics: {
        users: usersResult.count || 0,
        draws: drawsResult.count || 0,
        winners: winners.length,
        charities: charities.length,
        activeCharities: charities.filter((charity) => charity.is_active !== false).length,
        activeSubscriptions,
        payoutCommitted,
      },
    });
  } catch (err) {
    console.error("Unexpected error in getAdminOverview:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAdminReports = async (req, res) => {
  try {
    const { data: draws, error: drawsError } = await supabase
      .from("draws")
      .select("id, month, year, status")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(12);

    if (drawsError) {
      console.error("Error fetching draws for reports:", drawsError);
      return res.status(500).json({ error: "Failed to fetch draw reports" });
    }

    const drawIds = (draws || []).map((draw) => draw.id);

    let winners = [];
    if (drawIds.length > 0) {
      const { data: winnersData, error: winnersError } = await supabase
        .from("winners")
        .select("id, draw_id, match_type, status, prize_amount");

      if (!winnersError) {
        winners = (winnersData || []).filter((row) => drawIds.includes(row.draw_id));
      }
    }

    const drawReports = (draws || []).map((draw) => {
      const relatedWinners = winners.filter((winner) => winner.draw_id === draw.id);
      return {
        drawId: draw.id,
        period: `${draw.month}/${draw.year}`,
        status: draw.status,
        totalWinners: relatedWinners.length,
        paidWinners: relatedWinners.filter((winner) => String(winner.status) === "paid").length,
        approvedWinners: relatedWinners.filter((winner) => String(winner.status) === "approved").length,
        payoutTotal: relatedWinners.reduce((sum, winner) => sum + Number(winner.prize_amount || 0), 0),
      };
    });

    return res.status(200).json({ reports: drawReports });
  } catch (err) {
    console.error("Unexpected error in getAdminReports:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAdminOverview,
  getAdminReports,
};
