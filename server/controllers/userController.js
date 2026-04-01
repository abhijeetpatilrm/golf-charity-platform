const supabase = require("../config/supabaseAdmin");

const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*");

    if (error) {
      if (error.code === "42P01") {
        return res.status(200).json({ users: [] });
      }

      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    const normalizedUsers = (users || []).map((user) => ({
      id: user.id,
      name: user.name || null,
      email: user.email || null,
      subscription_status: user.subscription_status || null,
      created_at: user.created_at || null,
    }));

    normalizedUsers.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    const userIds = normalizedUsers.map((user) => user.id);
    let scoreCountsByUser = {};

    if (userIds.length > 0) {
      const { data: scores, error: scoresError } = await supabase
        .from("scores")
        .select("user_id")
        .in("user_id", userIds);

      if (!scoresError) {
        scoreCountsByUser = (scores || []).reduce((acc, scoreRow) => {
          const key = scoreRow.user_id;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
      }
    }

    const usersWithStats = normalizedUsers.map((user) => ({
      ...user,
      total_scores: scoreCountsByUser[user.id] || 0,
    }));

    return res.status(200).json({ users: usersWithStats });
  } catch (err) {
    console.error("Unexpected error in getUsers:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, subscription_status } = req.body;

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) payload.name = name;
    if (role !== undefined) payload.role = role;
    if (subscription_status !== undefined) payload.subscription_status = subscription_status;

    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)
      .select("id, name, email, role, subscription_status, created_at, updated_at")
      .maybeSingle();

    if (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: data,
    });
  } catch (err) {
    console.error("Unexpected error in updateUser:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getUsers,
  updateUser,
};
