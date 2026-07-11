const express = require("express");
const { protect } = require("../middleware/auth");
const { resetDailyCountersIfNeeded, creditCoins } = require("../utils/rewardHelpers");
const { createSession } = require("../utils/sessionStore");

const router = express.Router();

const COINS_PER_AD_VIEW = Number(process.env.COINS_PER_AD_VIEW || 10);
const DAILY_AD_VIEW_CAP = Number(process.env.DAILY_AD_VIEW_CAP || 20);
const DAILY_GAME_EARN_CAP = Number(process.env.DAILY_GAME_EARN_CAP || 200);

// ---------------------------------------------------------------------------
// STEP 1: Client asks permission to watch an ad. We just check the daily cap
// and hand back a one-time sessionId. We do NOT credit coins here.
// The ad SDK (AdMob/Adsterra/Unity Ads) will notify our /postback/ad-network
// route server-to-server once the ad is verified as fully watched.
// ---------------------------------------------------------------------------
router.post("/ad/request", protect, async (req, res) => {
  const user = req.user;
  resetDailyCountersIfNeeded(user);

  if (user.dailyAdViews >= DAILY_AD_VIEW_CAP) {
    return res.status(429).json({ message: "Daily ad view limit reached. Come back tomorrow!" });
  }

  const sessionId = createSession(user._id);
  await user.save(); // persists any daily-counter reset

  res.json({
    sessionId,
    message: "Ad session created. Launch the rewarded ad SDK with this session id.",
  });
});

// ---------------------------------------------------------------------------
// Mini-games: client reports a completed round. Since there's no external
// ad network verifying this, we rely on server-side score sanity checks +
// daily earning caps to blunt farming/abuse. For anything higher-stakes,
// consider validating game state server-side instead of trusting the score.
// ---------------------------------------------------------------------------
router.post("/game/complete", protect, async (req, res) => {
  try {
    const { gameId, score } = req.body;
    const user = req.user;
    resetDailyCountersIfNeeded(user);

    if (user.dailyGameEarnings >= DAILY_GAME_EARN_CAP) {
      return res.status(429).json({ message: "Daily game earning cap reached." });
    }

    // Scoring rule for the 3D raycast target game: score is a hit-count
    // (roughly 3-15 hits in a 10s round), so give ~2 coins per hit.
    const coinsEarned = Math.min((score || 0) * 2, 30);
    if (coinsEarned <= 0) {
      return res.status(400).json({ message: "Score too low to earn coins" });
    }

    const cappedCoins = Math.min(coinsEarned, DAILY_GAME_EARN_CAP - user.dailyGameEarnings);
    user.dailyGameEarnings += cappedCoins;

    await creditCoins({
      user,
      type: "game_play",
      coins: cappedCoins,
      meta: { gameId, score },
    });

    res.json({ message: "Coins credited", coinsEarned: cappedCoins, newBalance: user.coinBalance });
  } catch (err) {
    res.status(500).json({ message: "Failed to process game reward", error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Offerwall: return an iframe/redirect URL with the user's id embedded as a
// sub/click id so the provider's postback can be matched to this user.
// Replace with your actual offerwall provider's URL format (AdGate/OfferToro/Torox).
// ---------------------------------------------------------------------------
router.get("/offers", protect, async (req, res) => {
  const offerwallBaseUrl = process.env.OFFERWALL_BASE_URL || "https://example-offerwall.com/wall";
  const publisherId = process.env.OFFERWALL_PUBLISHER_ID || "YOUR_PUBLISHER_ID";
  const url = `${offerwallBaseUrl}?pub=${publisherId}&sub_id=${req.user._id}`;
  res.json({ url });
});

module.exports = router;
