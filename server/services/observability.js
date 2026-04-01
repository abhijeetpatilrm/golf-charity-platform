const env = require("../config/env");

const writeLog = (level, message, meta = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};

const logInfo = (message, meta = {}) => writeLog("info", message, meta);
const logWarn = (message, meta = {}) => writeLog("warn", message, meta);
const logError = (message, meta = {}) => {
  writeLog("error", message, meta);

  if (env.ERROR_TRACKING_WEBHOOK_URL) {
    // Hook point for error tracking integrations.
    writeLog("info", "Error tracking webhook configured", {
      destination: "webhook",
    });
  }
};

module.exports = {
  logInfo,
  logWarn,
  logError,
};
