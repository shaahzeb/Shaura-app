import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Coin3D from "../components/Coin3D";
import Tilt3D from "../components/Tilt3D";
import { coinsToCurrency } from "../utils/currency";

const STATUS_COLORS = {
  pending: "#facc15",
  approved: "#38bdf8",
  paid: "#4ade80",
  rejected: "#f87171",
};

const STEPS = [
  { key: "pending", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
];

function WithdrawalStepper({ status }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="withdraw-stepper">
      {STEPS.map((step, i) => (
        <div key={step.key} className="withdraw-step">
          <div className={`withdraw-step-dot ${i <= currentIndex ? "withdraw-step-done" : ""}`}>
            {i < currentIndex ? "✓" : i + 1}
          </div>
          <span className={i <= currentIndex ? "withdraw-step-label-done" : "withdraw-step-label"}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`withdraw-step-line ${i < currentIndex ? "withdraw-step-done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [coinsRedeemed, setCoinsRedeemed] = useState("");
  const [method, setMethod] = useState("upi");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [captcha, setCaptcha] = useState(null); // { captchaId, question } - only set if the account is flagged
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const loadHistory = async () => {
    const { data } = await api.get("/withdraw/history");
    setHistory(data.withdrawals);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/withdraw/request", {
        coinsRedeemed: Number(coinsRedeemed),
        method,
        destination,
        captchaId: captcha?.captchaId,
        captchaAnswer,
      });
      setMessage("Withdrawal request submitted for review.");
      setCoinsRedeemed("");
      setDestination("");
      setCaptcha(null);
      setCaptchaAnswer("");
      refreshUser();
      loadHistory();
    } catch (err) {
      setMessage(err.response?.data?.message || "Withdrawal request failed");
      if (err.response?.data?.requiresCaptcha) {
        setCaptcha(err.response.data.captcha);
        setCaptchaAnswer("");
      }
    }
  };

  const filteredHistory = useMemo(() => {
    let list = [...history];
    if (statusFilter !== "all") list = list.filter((w) => w.status === statusFilter);
    list.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return list;
  }, [history, statusFilter, sortOrder]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Coins", "Cash Amount", "Method", "Status"],
      ...filteredHistory.map((w) => [
        new Date(w.createdAt).toLocaleDateString(),
        w.coinsRedeemed,
        w.cashAmount,
        w.method,
        w.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shaura-withdrawals.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-hero accent-green">
        <div className="page-hero-icon">💰</div>
        <div>
          <h2>Wallet</h2>
          <p>Track your balance and cash out to UPI, PayPal, or gift cards.</p>
        </div>
      </div>

      <Tilt3D max={5}>
        <div className="wallet-balance-box">
          <p style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Coin3D size={30} spin tilt={false} />
            Balance: {user?.coinBalance?.toLocaleString()} coins
          </p>
          <p className="balance-currency">≈ {coinsToCurrency(user?.coinBalance)}</p>
        </div>
      </Tilt3D>

      <div className="content-card accent-green">
        <h3 style={{ marginTop: 0 }}>Request a withdrawal</h3>
        <form onSubmit={handleSubmit} className="withdraw-form">
          <input
            type="number"
            placeholder="Coins to redeem"
            value={coinsRedeemed}
            onChange={(e) => setCoinsRedeemed(e.target.value)}
            required
          />
          {coinsRedeemed && <p className="withdraw-preview">You&apos;ll receive ≈ {coinsToCurrency(coinsRedeemed)}</p>}
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="upi">UPI</option>
            <option value="paypal">PayPal</option>
            <option value="gift_card">Gift Card</option>
          </select>
          <input
            placeholder="UPI ID / PayPal email / Gift card email"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
          {captcha && (
            <input
              placeholder={`Quick check: ${captcha.question}`}
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              required
            />
          )}
          <button type="submit" className="action-btn accent-green">
            Request Withdrawal
          </button>
        </form>

        {message && <p className="info">{message}</p>}
      </div>

      {filteredHistory.length > 0 && filteredHistory[0].status !== "rejected" && (
        <div className="content-card accent-green">
          <h3 style={{ marginTop: 0 }}>Latest withdrawal progress</h3>
          <WithdrawalStepper status={filteredHistory[0].status} />
        </div>
      )}

      <div className="content-card accent-green">
        <div className="wallet-history-header">
          <h3 style={{ margin: 0 }}>Withdrawal History</h3>
          <button type="button" className="export-btn" onClick={exportCsv} disabled={filteredHistory.length === 0}>
            ⬇ Export CSV
          </button>
        </div>

        <div className="wallet-filter-row">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {filteredHistory.length === 0 ? (
          <p style={{ color: "#9a9ca3", margin: 0 }}>No withdrawals match this filter.</p>
        ) : (
          <ul className="history-list">
            {filteredHistory.map((w) => (
              <li key={w._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  {w.coinsRedeemed} coins → ₹{w.cashAmount} ({w.method})
                  <br />
                  <small style={{ color: "#9a9ca3" }}>{new Date(w.createdAt).toLocaleDateString()}</small>
                </span>
                <strong style={{ color: STATUS_COLORS[w.status] || "#fff" }}>{w.status}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
