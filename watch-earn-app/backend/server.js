require("dotenv").config();

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy backend/.env.example to backend/.env and fill these in before starting the server.");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const rewardRoutes = require("./routes/rewards");
const postbackRoutes = require("./routes/postback");
const withdrawRoutes = require("./routes/withdraw");
const adminRoutes = require("./routes/admin");

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Basic rate limiting to slow down abuse/farming bots
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { message: "Too many requests, please slow down." },
});
app.use("/api/", limiter);

app.get("/", (req, res) => res.send("Watch & Earn API is running"));
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.use("/api/auth", authRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/postback", postbackRoutes); // rate-limited more loosely below; lock down with ipWhitelist env vars in production
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin", adminRoutes);

// 404 for unmatched API routes
app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

// Global error handler - catches anything thrown/rejected in route handlers
// that wasn't already caught locally, so the process doesn't crash and the
// client gets a clean JSON error instead of a raw stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
