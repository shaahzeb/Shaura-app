const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, // hashed
    coinBalance: { type: Number, default: 0 },
    totalEarnedCoins: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Daily caps tracking
    dailyAdViews: { type: Number, default: 0 },
    dailyGameEarnings: { type: Number, default: 0 },
    lastActivityDate: { type: String, default: null }, // YYYY-MM-DD, used to reset daily counters

    // Anti-fraud signals
    deviceFingerprints: [{ type: String }],
    lastKnownIP: { type: String },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
