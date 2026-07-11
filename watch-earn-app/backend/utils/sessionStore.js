// Simple in-memory store mapping ad-session-id -> { userId, expiresAt, used }.
// Good enough for a single backend instance / low-medium traffic. If you
// scale to multiple backend instances behind a load balancer, swap this
// for Redis (same get/set/delete shape) so sessions are shared across
// instances instead of living only in one process's memory.

const store = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

function createSession(userId) {
  const id = `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  store.set(id, { userId: String(userId), expiresAt: Date.now() + SESSION_TTL_MS, used: false });
  return id;
}

// Validates AND consumes the session in one step so it can't be replayed.
function consumeSession(sessionId, userId) {
  const entry = store.get(sessionId);
  if (!entry) return false;
  if (entry.used) return false;
  if (entry.expiresAt < Date.now()) {
    store.delete(sessionId);
    return false;
  }
  if (String(entry.userId) !== String(userId)) return false;

  entry.used = true;
  store.set(sessionId, entry);
  return true;
}

// Periodic cleanup so the Map doesn't grow unbounded on a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(id);
  }
}, 5 * 60 * 1000).unref?.();

module.exports = { createSession, consumeSession };
