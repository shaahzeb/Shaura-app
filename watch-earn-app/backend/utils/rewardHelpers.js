const Transaction = require("../models/Transaction");

// Returns today's date as YYYY-MM-DD (server timezone - consider UTC for consistency)
const todayStr = () => new Date().toISOString().split("T")[0];

// Resets daily counters on a user doc if the stored date isn't today.
// Call this before checking/incrementing any daily cap.
const resetDailyCountersIfNeeded = (user) => {
  const today = todayStr();
  if (user.lastActivityDate !== today) {
    user.dailyAdViews = 0;
    user.dailyGameEarnings = 0;
    user.lastActivityDate = today;
  }
};

// Credits coins to a user, logs a transaction, and optionally records
// the real revenue you earned from the ad network/offerwall for that action.
// Always call this from server-verified events, never directly from a
// client-reported "I watched the ad" request.
const creditCoins = async ({ user, type, coins, revenueEarnedUSD = 0, meta = {} }) => {
  user.coinBalance += coins;
  user.totalEarnedCoins += coins;
  await user.save();

  await Transaction.create({
    user: user._id,
    type,
    coins,
    revenueEarnedUSD,
    meta,
    status: "confirmed",
  });
};

module.exports = { todayStr, resetDailyCountersIfNeeded, creditCoins };
