import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Coin3D from "../components/Coin3D";

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [coinsRedeemed, setCoinsRedeemed] = useState("");
  const [method, setMethod] = useState("upi");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

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
      });
      setMessage("Withdrawal request submitted for review.");
      setCoinsRedeemed("");
      setDestination("");
      refreshUser();
      loadHistory();
    } catch (err) {
      setMessage(err.response?.data?.message || "Withdrawal request failed");
    }
  };

  return (
    <div className="page">
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <Coin3D size={30} spin tilt={false} />
        Wallet
      </h2>
      <p>Balance: {user?.coinBalance?.toLocaleString()} coins</p>

      <form onSubmit={handleSubmit} className="withdraw-form">
        <input
          type="number"
          placeholder="Coins to redeem"
          value={coinsRedeemed}
          onChange={(e) => setCoinsRedeemed(e.target.value)}
          required
        />
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
        <button type="submit">Request Withdrawal</button>
      </form>

      {message && <p className="info">{message}</p>}

      <h3>Withdrawal History</h3>
      <ul className="history-list">
        {history.map((w) => (
          <li key={w._id}>
            {w.coinsRedeemed} coins → {w.cashAmount} ({w.method}) — <strong>{w.status}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
