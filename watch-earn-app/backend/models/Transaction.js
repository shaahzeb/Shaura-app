const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["ad_view", "game_play", "offer_complete", "referral_bonus", "withdrawal", "admin_adjustment"],
      required: true,
    },
    coins: { type: Number, required: true }, // positive = credit, negative = debit
    // Real revenue side (owner's ledger) - only populated for ad_view / offer_complete
    revenueEarnedUSD: { type: Number, default: 0 },
    meta: { type: Object, default: {} }, // e.g. ad network name, offer id, postback payload
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
