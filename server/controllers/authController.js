const supabase = require("../config/supabase");
const env = require("../config/env");

const canUseDevAuthBypass = () => {
  return process.env.ALLOW_DEV_AUTH_BYPASS !== "false";
};

const createDevSession = ({ id, email, role, name }) => {
  const payload = {
    id,
    email,
    role: (role || "subscriber").toLowerCase(),
    name: name || null,
  };

  return {
    access_token: `dev.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`,
    refresh_token: null,
  };
};

const syncDevUserRecord = async ({ id, email, role, name, charityId, contributionPercent }) => {
  const now = new Date().toISOString();

  const { error: userUpsertError } = await supabase.from("users").upsert(
    {
      id,
      name: name || "Dev Admin",
      email,
      role: (role || "admin").toLowerCase(),
      subscription_status: "active",
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (userUpsertError && userUpsertError.code !== "42P01") {
    console.error("Failed to mirror dev signup user into users table:", userUpsertError);
  }

  if (charityId) {
    const { error: preferenceError } = await supabase.from("user_charity_preferences").upsert(
      {
        user_id: id,
        charity_id: charityId,
        contribution_percent: Number(contributionPercent || 10),
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

    if (preferenceError && preferenceError.code !== "42P01") {
      console.error("Failed to save dev signup charity preference:", preferenceError);
    }
  }
};

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

    if (canUseDevAuthBypass()) {
      const isDevAdmin =
        env.DEV_USER_EMAIL &&
        email.trim().toLowerCase() === env.DEV_USER_EMAIL.trim().toLowerCase();
      const accountId = isDevAdmin
        ? env.DEV_USER_ID || "00000000-0000-0000-0000-000000000001"
        : `dev-${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "user"}`;

      await syncDevUserRecord({
        id: accountId,
        email,
        role: isDevAdmin ? env.DEV_USER_ROLE || "admin" : (role || "subscriber"),
        name: name || (isDevAdmin ? "Dev Admin" : "Dev User"),
        charityId,
        contributionPercent,
      });

      const session = createDevSession({
        id: accountId,
        email,
        role: isDevAdmin ? env.DEV_USER_ROLE || "admin" : (role || "subscriber"),
        name: name || (isDevAdmin ? "Dev Admin" : "Dev User"),
      });

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: accountId,
          email,
          role: (isDevAdmin ? env.DEV_USER_ROLE || "admin" : (role || "subscriber")).toLowerCase(),
        },
        session,
      });
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

    if (
      canUseDevAuthBypass() &&
      env.DEV_USER_EMAIL &&
      email.trim().toLowerCase() === env.DEV_USER_EMAIL.trim().toLowerCase()
    ) {
      const session = createDevSession({
        id: env.DEV_USER_ID || "00000000-0000-0000-0000-000000000001",
        email: env.DEV_USER_EMAIL,
        role: env.DEV_USER_ROLE || "admin",
        name: "Dev Admin",
      });

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: env.DEV_USER_ID || "00000000-0000-0000-0000-000000000001",
          email: env.DEV_USER_EMAIL,
          role: (env.DEV_USER_ROLE || "admin").toLowerCase(),
        },
        session,
      });
    }

    if (canUseDevAuthBypass()) {
      const accountId = `dev-${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "user"}`;
      const session = createDevSession({
        id: accountId,
        email,
        role: "subscriber",
        name: "Dev User",
      });

      await syncDevUserRecord({
        id: accountId,
        email,
        role: "subscriber",
        name: "Dev User",
      });

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: accountId,
          email,
          role: "subscriber",
        },
        session,
      });
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
