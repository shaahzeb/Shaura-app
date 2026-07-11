// Restricts a route to a comma-separated list of IPs from an env var.
// If the env var is unset/empty, the check is skipped (useful for local
// dev before you know your ad network's/offerwall's outgoing IPs). Once
// you have real provider accounts, set AD_NETWORK_ALLOWED_IPS /
// OFFERWALL_ALLOWED_IPS in production to lock these down for real.
function ipWhitelist(envVarName) {
  return (req, res, next) => {
    const raw = process.env[envVarName];
    if (!raw) return next(); // not configured yet - allow through

    const allowed = raw.split(",").map((ip) => ip.trim());
    const requestIp = (req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();

    if (allowed.includes(requestIp)) return next();

    console.warn(`Blocked postback from non-whitelisted IP: ${requestIp}`);
    return res.status(403).send("Forbidden");
  };
}

module.exports = ipWhitelist;
