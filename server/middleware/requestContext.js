const { randomUUID } = require("crypto");

const attachRequestContext = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const requestId = typeof incoming === "string" && incoming.trim() ? incoming : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  return next();
};

module.exports = {
  attachRequestContext,
};
