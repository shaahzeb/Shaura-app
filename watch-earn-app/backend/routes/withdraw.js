const express = require("express");
const { protect } = require("../middleware/auth");
const Withdrawal = require("../models/Withdrawal");
const { creditCoins } = require("../utils/rewardHelpers");

const router = express.Router();

const MIN_WITHDRAWAL_COINS = Number(process.env.MIN_WITHDRAWAL_COINS || 5000);
const COIN_TO_CASH_RATE = Number(process.env.COIN_TO_CASH_RATE || 0.001);

// POST /api/withdraw/request
router.post("/request", protect, async (req, res) => {
  try {
    const { coinsRedeemed, method, destination } = req.body;
    const user = req.user;

    if (!coinsRedeemed || coinsRedeemed < MIN_WITHDRAWAL_COINS) {
      return res.status(400).json({
        message: `Minimum withdrawal is ${MIN_WITHDRAWAL_COINS} coins`,
      });
    }
    if (coinsRedeemed > user.coinBalance) {
      return res.status(400).json({ message: "Insufficient coin balance" });
    }
    if (!method || !destination) {
      return res.status(400).json({ message: "Payout method and destination are required" });
    }

    const cashAmount = Number((coinsRedeemed * COIN_TO_CASH_RATE).toFixed(2));

    // Deduct coins immediately (reserved), request goes to admin approval queue
    await creditCoins({
      user,
      type: "withdrawal",
      coins: -coinsRedeemed,
      meta: { method, destination, status: "pending" },
    });

    const withdrawal = await Withdrawal.create({
      user: user._id,
      coinsRedeemed,
      cashAmount,
      method,
      destination,
      status: "pending",
    });

    res.status(201).json({ message: "Withdrawal request submitted", withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Withdrawal request failed", error: err.message });
  }
});

// GET /api/withdraw/history
router.get("/history", protect, async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ withdrawals });
});

module.exports = router;
