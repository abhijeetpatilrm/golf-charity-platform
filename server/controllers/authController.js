const supabase = require("../config/supabase");

const signUp = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      charityId,
      contributionPercent,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
          role: (role || "subscriber").toLowerCase(),
        },
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      return res.status(400).json({ error: error.message || "Failed to sign up" });
    }

    const authUserId = data?.user?.id;
    if (authUserId) {
      const now = new Date().toISOString();

      const { error: userUpsertError } = await supabase.from("users").upsert(
        {
          id: authUserId,
          name: name || null,
          email,
          role: (role || "subscriber").toLowerCase(),
          updated_at: now,
        },
        { onConflict: "id" },
      );

      if (userUpsertError && userUpsertError.code !== "42P01") {
        console.error("Failed to mirror signup user into users table:", userUpsertError);
      }

      if (charityId) {
        const { error: preferenceError } = await supabase
          .from("user_charity_preferences")
          .upsert(
            {
              user_id: authUserId,
              charity_id: charityId,
              contribution_percent: Number(contributionPercent || 10),
              updated_at: now,
            },
            { onConflict: "user_id" },
          );

        if (preferenceError && preferenceError.code !== "42P01") {
          console.error("Failed to save signup charity preference:", preferenceError);
        }
      }
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error("Unexpected error in signUp:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in:", error);
      return res.status(401).json({ error: error.message || "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login successful",
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error("Unexpected error in signIn:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (err) {
    console.error("Unexpected error in getMe:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  signUp,
  signIn,
  getMe,
};
