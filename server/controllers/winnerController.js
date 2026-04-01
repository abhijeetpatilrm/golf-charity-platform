const supabase = require("../config/supabaseAdmin");

const allowedTransitions = {
  pending: ["approved", "rejected"],
  approved: ["paid"],
  rejected: [],
  paid: [],
};

const writeWinnerAuditLog = async ({ winnerId, actorUserId, action, fromStatus, toStatus, note }) => {
  const { error } = await supabase.from("winner_status_audit_logs").insert({
    winner_id: winnerId,
    actor_user_id: actorUserId || null,
    action,
    from_status: fromStatus || null,
    to_status: toStatus || null,
    note: note || null,
  });

  if (error && error.code !== "42P01") {
    console.error("Failed to write winner audit log:", error);
  }
};

const writePayoutRecord = async ({ winner, actorUserId }) => {
  const referenceCode = `pay_${winner.id.slice(0, 8)}_${Date.now()}`;

  const { error } = await supabase.from("payout_records").insert({
    winner_id: winner.id,
    user_id: winner.user_id,
    draw_id: winner.draw_id,
    amount: Number(winner.prize_amount || 0),
    currency: "USD",
    status: "paid",
    reference_code: referenceCode,
    processed_by: actorUserId || null,
    processed_at: new Date().toISOString(),
  });

  if (error && error.code !== "42P01") {
    console.error("Failed to write payout record:", error);
  }
};

const getWinners = async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from("winners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching winners:", error);
      return res.status(500).json({ error: "Failed to fetch winners" });
    }

    return res.status(200).json({ winners });
  } catch (err) {
    console.error("Unexpected error in getWinners:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getMyWinnings = async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from("winners")
      .select("id, draw_id, match_type, prize_amount, status, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user winnings:", error);
      return res.status(500).json({ error: "Failed to fetch winnings" });
    }

    const rows = winners || [];
    const totalWinnings = rows.reduce((sum, row) => sum + Number(row.prize_amount || 0), 0);
    const paidTotal = rows
      .filter((row) => String(row.status || "").toLowerCase() === "paid")
      .reduce((sum, row) => sum + Number(row.prize_amount || 0), 0);

    return res.status(200).json({
      winnings: rows,
      summary: {
        totalWinnings,
        paidTotal,
        pendingCount: rows.filter((row) => String(row.status || "").toLowerCase() === "approved").length,
      },
    });
  } catch (err) {
    console.error("Unexpected error in getMyWinnings:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPayoutRecords = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payout_records")
      .select("*")
      .order("processed_at", { ascending: false })
      .limit(200);

    if (error) {
      if (error.code === "42P01") {
        return res.status(200).json({ payoutRecords: [] });
      }

      console.error("Error fetching payout records:", error);
      return res.status(500).json({ error: "Failed to fetch payout records" });
    }

    return res.status(200).json({ payoutRecords: data || [] });
  } catch (err) {
    console.error("Unexpected error in getPayoutRecords:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getWinnerAuditLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("winner_status_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(400);

    if (error) {
      if (error.code === "42P01") {
        return res.status(200).json({ auditLogs: [] });
      }

      console.error("Error fetching winner audit logs:", error);
      return res.status(500).json({ error: "Failed to fetch winner audit logs" });
    }

    return res.status(200).json({ auditLogs: data || [] });
  } catch (err) {
    console.error("Unexpected error in getWinnerAuditLogs:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateWinnerStatus = async (winnerId, status, actorUserId) => {
  const { data: existingWinner, error: findError } = await supabase
    .from("winners")
    .select("*")
    .eq("id", winnerId)
    .maybeSingle();

  if (findError) {
    return {
      ok: false,
      status: 500,
      error: "Failed to fetch winner",
      details: findError,
    };
  }

  if (!existingWinner) {
    return {
      ok: false,
      status: 404,
      error: "Winner not found",
    };
  }

  const currentStatus = String(existingWinner.status || "pending").toLowerCase();
  const nextStatus = String(status).toLowerCase();
  const allowed = allowedTransitions[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      status: 409,
      error: `Invalid status transition from ${currentStatus} to ${nextStatus}`,
    };
  }

  const { data: updatedWinner, error: updateError } = await supabase
    .from("winners")
    .update({ status: nextStatus })
    .eq("id", winnerId)
    .select("*")
    .single();

  if (updateError) {
    return {
      ok: false,
      status: 500,
      error: "Failed to update winner status",
      details: updateError,
    };
  }

  await writeWinnerAuditLog({
    winnerId,
    actorUserId,
    action: `winner.${nextStatus}`,
    fromStatus: currentStatus,
    toStatus: nextStatus,
  });

  if (nextStatus === "paid") {
    await writePayoutRecord({
      winner: updatedWinner,
      actorUserId,
    });
  }

  return {
    ok: true,
    winner: updatedWinner,
  };
};

const createStatusHandler = (status) => async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "winner id is required" });
    }

    const result = await updateWinnerStatus(id, status, req.user?.id || null);

    if (!result.ok) {
      if (result.details) {
        console.error(`Error updating winner to ${status}:`, result.details);
      }

      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({
      message: `Winner ${status} successfully`,
      winner: result.winner,
    });
  } catch (err) {
    console.error(`Unexpected error while updating winner to ${status}:`, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const approveWinner = createStatusHandler("approved");
const rejectWinner = createStatusHandler("rejected");
const payWinner = createStatusHandler("paid");

module.exports = {
  getWinners,
  getMyWinnings,
  getPayoutRecords,
  getWinnerAuditLogs,
  approveWinner,
  rejectWinner,
  payWinner,
};
