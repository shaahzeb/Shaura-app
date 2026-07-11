const express = require("express");
const User = require("../models/User");
const { creditCoins, resetDailyCountersIfNeeded } = require("../utils/rewardHelpers");
const { consumeSession } = require("../utils/sessionStore");
const ipWhitelist = require("../middleware/ipWhitelist");

const router = express.Router();

const COINS_PER_AD_VIEW = Number(process.env.COINS_PER_AD_VIEW || 10);
const COINS_PER_OFFER_BASE = Number(process.env.COINS_PER_OFFER_BASE || 50);

// ---------------------------------------------------------------------------
// Ad network postback - called SERVER-TO-SERVER by your ad network
// (e.g. AdMob rewarded ad server-side verification, Adsterra, Unity Ads)
// once a user has genuinely watched a rewarded ad to completion.
// This is the ONLY place ad-view coins should ever be credited from.
//
// Example expected query params (adjust to match your ad network's spec):
//   ?user_id=...&session_id=...&secret=...&revenue=0.008
// The session_id must match one issued by POST /rewards/ad/request for
// this exact user - this is what stops someone from replaying an old
// callback or forging one with just a guessed user_id.
// ---------------------------------------------------------------------------
router.get("/ad-network", ipWhitelist("AD_NETWORK_ALLOWED_IPS"), async (req, res) => {
  try {
    const { user_id, session_id, secret, revenue } = req.query;

    if (secret !== process.env.AD_NETWORK_POSTBACK_SECRET) {
      return res.status(403).send("Invalid secret");
    }
    if (!session_id || !consumeSession(session_id, user_id)) {
      return res.status(400).send("Invalid or already-used session");
    }

    const user = await User.findById(user_id);
    if (!user) return res.status(404).send("User not found");

    resetDailyCountersIfNeeded(user);
    user.dailyAdViews += 1;

    await creditCoins({
      user,
      type: "ad_view",
      coins: COINS_PER_AD_VIEW,
      revenueEarnedUSD: Number(revenue) || 0,
      meta: { source: "ad_network_postback", query: req.query },
    });

    // Most ad networks expect a 200 OK / specific string response to
    // acknowledge receipt - check your provider's docs.
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("Error processing postback");
  }
});

// ---------------------------------------------------------------------------
// Offerwall postback - called by your offerwall provider (AdGate/OfferToro/
// Torox) when a user completes an offer (survey, app install, sign-up etc).
//
// Example expected query params (adjust to match your provider's spec):
//   ?sub_id=...&payout=0.75&offer_id=...&secret=...
// ---------------------------------------------------------------------------
router.get("/offerwall", ipWhitelist("OFFERWALL_ALLOWED_IPS"), async (req, res) => {
  try {
    const { sub_id, payout, offer_id, secret } = req.query;

    if (secret !== process.env.OFFERWALL_POSTBACK_SECRET) {
      return res.status(403).send("Invalid secret");
    }

    const user = await User.findById(sub_id);
    if (!user) return res.status(404).send("User not found");

    const revenueUSD = Number(payout) || 0;
    // Pass a portion of what the offerwall pays you to the user as coins.
    // Tune this margin - e.g. give the user coins worth ~50-60% of payout.
    const marginShare = 0.5;
    const coinsToCredit = Math.max(
      COINS_PER_OFFER_BASE,
      Math.round((revenueUSD * marginShare) / Number(process.env.COIN_TO_CASH_RATE || 0.001))
    );

    await creditCoins({
      user,
      type: "offer_complete",
      coins: coinsToCredit,
      revenueEarnedUSD: revenueUSD,
      meta: { source: "offerwall_postback", offer_id, query: req.query },
    });

    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("Error processing postback");
  }
});

module.exports = router;
