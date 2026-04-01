const supabase = require("../config/supabaseAdmin");

const submitWinnerVerification = async (req, res) => {
  try {
    const { winnerId, proofUrl, note } = req.body;

    if (!winnerId || !proofUrl) {
      return res.status(400).json({ error: "winnerId and proofUrl are required" });
    }

    const payload = {
      winner_id: winnerId,
      submitted_by: req.user.id,
      proof_url: proofUrl,
      note: note || null,
      status: "submitted",
    };

    const { data, error } = await supabase
      .from("winner_verifications")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (error.code === "42P01") {
        return res.status(500).json({ error: "winner_verifications table is not initialized" });
      }

      console.error("Error submitting verification:", error);
      return res.status(500).json({ error: "Failed to submit verification" });
    }

    return res.status(201).json({
      message: "Verification submitted",
      verification: data,
    });
  } catch (err) {
    console.error("Unexpected error in submitWinnerVerification:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPendingVerifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("winner_verifications")
      .select("*")
      .eq("status", "submitted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending verifications:", error);
      return res.status(200).json({ verifications: [] });
    }

    return res.status(200).json({ verifications: data || [] });
  } catch (err) {
    console.error("Unexpected error in getPendingVerifications:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateVerificationStatus = (status) => async (req, res) => {
  try {
    const { id } = req.params;

    const { data: verification, error: findError } = await supabase
      .from("winner_verifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      if (findError.code === "42P01") {
        return res.status(500).json({ error: "winner_verifications table is not initialized" });
      }

      console.error("Error finding verification:", findError);
      return res.status(500).json({ error: "Failed to fetch verification" });
    }

    if (!verification) {
      return res.status(404).json({ error: "Verification not found" });
    }

    const { data: updated, error: updateError } = await supabase
      .from("winner_verifications")
      .update({
        status,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating verification status:", updateError);
      return res.status(500).json({ error: "Failed to update verification status" });
    }

    return res.status(200).json({
      message: `Verification ${status}`,
      verification: updated,
    });
  } catch (err) {
    console.error("Unexpected error in updateVerificationStatus:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const approveVerification = updateVerificationStatus("approved");
const rejectVerification = updateVerificationStatus("rejected");

module.exports = {
  submitWinnerVerification,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
};
