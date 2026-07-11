const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coinsRedeemed: { type: Number, required: true },
    cashAmount: { type: Number, required: true }, // in USD or INR, based on your locale
    method: { type: String, enum: ["upi", "paypal", "gift_card"], required: true },
    destination: { type: String, required: true }, // UPI id / PayPal email / gift card email
    status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", WithdrawalSchema);
