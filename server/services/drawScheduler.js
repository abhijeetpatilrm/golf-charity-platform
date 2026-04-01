const supabase = require("../config/supabaseAdmin");
const { runDrawCore } = require("../controllers/drawController");

let schedulerIntervalId = null;
let lastRunKey = null;

const shouldRunNow = (now) => {
  const enabled = process.env.DRAW_SCHEDULER_ENABLED === "true";
  if (!enabled) {
    return false;
  }

  const targetHour = Number(process.env.DRAW_SCHEDULER_HOUR_UTC || 18);
  const targetMinute = Number(process.env.DRAW_SCHEDULER_MINUTE_UTC || 0);

  const lastDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();

  return (
    now.getUTCDate() === lastDayOfMonth &&
    now.getUTCHours() === targetHour &&
    now.getUTCMinutes() >= targetMinute
  );
};

const alreadyRanForMonth = async (month, year) => {
  const { data, error } = await supabase
    .from("draws")
    .select("id")
    .eq("month", month)
    .eq("year", year)
    .limit(1);

  if (error) {
    return true;
  }

  return (data || []).length > 0;
};

const runScheduledDrawIfDue = async () => {
  const now = new Date();
  if (!shouldRunNow(now)) {
    return;
  }

  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const runKey = `${year}-${month}`;

  if (lastRunKey === runKey) {
    return;
  }

  const exists = await alreadyRanForMonth(month, year);
  if (exists) {
    lastRunKey = runKey;
    return;
  }

  try {
    await runDrawCore({
      drawType: process.env.DRAW_SCHEDULER_DEFAULT_TYPE || "5",
      mode: process.env.DRAW_SCHEDULER_DEFAULT_MODE || "random",
      month,
      year,
    });
    lastRunKey = runKey;
    console.log(`[draw-scheduler] Monthly draw published for ${month}/${year}`);
  } catch (err) {
    console.error("[draw-scheduler] Failed to run scheduled draw:", err.message);
  }
};

const startDrawScheduler = () => {
  if (schedulerIntervalId) {
    return;
  }

  schedulerIntervalId = setInterval(() => {
    runScheduledDrawIfDue();
  }, 5 * 60 * 1000);

  runScheduledDrawIfDue();
  console.log("[draw-scheduler] started");
};

module.exports = {
  startDrawScheduler,
};
