const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Withdrawal = require("../models/Withdrawal");

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/overview - revenue vs payouts summary
router.get("/overview", async (req, res) => {
  const totalRevenue = await Transaction.aggregate([
    { $match: { type: { $in: ["ad_view", "offer_complete"] } } },
    { $group: { _id: null, total: { $sum: "$revenueEarnedUSD" } } },
  ]);

  const totalPaidOut = await Withdrawal.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: null, total: { $sum: "$cashAmount" } } },
  ]);

  const pendingWithdrawals = await Withdrawal.countDocuments({ status: "pending" });
  const totalUsers = await User.countDocuments();
  const flaggedUsers = await User.countDocuments({ flagged: true });

  const revenue = totalRevenue[0]?.total || 0;
  const paidOut = totalPaidOut[0]?.total || 0;

  res.json({
    totalRevenueUSD: revenue,
    totalPaidOutUSD: paidOut,
    marginUSD: Number((revenue - paidOut).toFixed(2)),
    pendingWithdrawals,
    totalUsers,
    flaggedUsers,
  });
});

// GET /api/admin/withdrawals - list, filter by status
router.get("/withdrawals", async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const withdrawals = await Withdrawal.find(filter).populate("user", "name email").sort({ createdAt: -1 });
  res.json({ withdrawals });
});

// PATCH /api/admin/withdrawals/:id - approve/reject/mark paid
router.patch("/withdrawals/:id", async (req, res) => {
  const { status, adminNote } = req.body;
  if (!["approved", "rejected", "paid"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

  // If rejected, refund the coins back to the user
  if (status === "rejected" && withdrawal.status !== "rejected") {
    const user = await User.findById(withdrawal.user);
    if (user) {
      user.coinBalance += withdrawal.coinsRedeemed;
      await user.save();
    }
  }

  withdrawal.status = status;
  withdrawal.adminNote = adminNote || withdrawal.adminNote;
  await withdrawal.save();

  res.json({ message: "Withdrawal updated", withdrawal });
});

// GET /api/admin/users - list users, flagged first
router.get("/users", async (req, res) => {
  const users = await User.find().select("-password").sort({ flagged: -1, createdAt: -1 }).limit(200);
  res.json({ users });
});

// PATCH /api/admin/users/:id/flag - flag/unflag a user for suspected fraud
router.patch("/users/:id/flag", async (req, res) => {
  const { flagged, flagReason } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { flagged, flagReason: flagReason || null },
    { new: true }
  ).select("-password");
  res.json({ user });
});

module.exports = router;
