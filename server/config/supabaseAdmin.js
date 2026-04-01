const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabaseAdmin;
