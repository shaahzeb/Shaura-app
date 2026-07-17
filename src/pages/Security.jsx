import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Security() {
  const { user, refreshUser, logout } = useAuth();
  const [loginHistory, setLoginHistory] = useState([]);
  const [setupData, setSetupData] = useState(null); // { secret, qrCodeDataUrl }
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const loadHistory = () => {
    api.get("/auth/login-history").then(({ data }) => setLoginHistory(data.loginHistory));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await api.post("/auth/logout-all-devices");
    } catch {
      // even if the request fails, the safest move is still to clear this
      // device's session locally
    } finally {
      logout();
    }
  };

  const startSetup = async () => {
    setMessage("");
    const { data } = await api.post("/auth/2fa/setup");
    setSetupData(data);
  };

  const confirmEnable = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/2fa/enable", { code });
      setMessage("Two-factor authentication is now enabled.");
      setSetupData(null);
      setCode("");
      refreshUser();
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid code");
    }
  };

  const disable2FA = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/2fa/disable", { code });
      setMessage("Two-factor authentication disabled.");
      setCode("");
      refreshUser();
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid code");
    }
  };

  return (
    <div className="page">
      <div className="page-hero accent-blue">
        <div className="page-hero-icon">🔒</div>
        <div>
          <h2>Security</h2>
          <p>Manage two-factor authentication and review recent logins.</p>
        </div>
      </div>

      {user?.flagged && (
        <div className="content-card accent-orange">
          <h3 style={{ marginTop: 0 }}>⚠️ Account under review</h3>
          <p style={{ color: "#9a9ca3", fontSize: "0.85rem", margin: 0 }}>
            We noticed unusual activity on your account{user.flagReason ? ` (${user.flagReason})` : ""}. Some
            actions like withdrawals may ask for an extra CAPTCHA check. This doesn&apos;t block normal use — if you
            think this is a mistake, contact support.
          </p>
        </div>
      )}

      <div className="content-card accent-blue">
        <h3 style={{ marginTop: 0 }}>Two-Factor Authentication (2FA)</h3>
        <p style={{ color: "#9a9ca3", fontSize: "0.85rem" }}>
          Adds a second step at login using an authenticator app (Google Authenticator, Authy, etc.) — even if
          someone gets your password, they can&apos;t log in without your phone.
        </p>

        {message && <p className="info">{message}</p>}

        {user?.twoFactorEnabled ? (
          <>
            <p style={{ color: "#4ade80", fontWeight: 700 }}>✓ 2FA is currently enabled</p>
            <form onSubmit={disable2FA} className="withdraw-form">
              <input
                placeholder="Enter code from your authenticator app to disable"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <button type="submit" className="action-btn accent-blue">
                Disable 2FA
              </button>
            </form>
          </>
        ) : setupData ? (
          <div>
            <p>1. Scan this QR code in your authenticator app:</p>
            <img src={setupData.qrCodeDataUrl} alt="2FA QR code" style={{ background: "#fff", padding: 8, borderRadius: 8 }} />
            <p style={{ fontSize: "0.75rem", color: "#9a9ca3" }}>
              Or enter this code manually: <code>{setupData.secret}</code>
            </p>
            <form onSubmit={confirmEnable} className="withdraw-form">
              <input
                placeholder="Enter the 6-digit code to confirm"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <button type="submit" className="action-btn accent-blue">
                Confirm & Enable
              </button>
            </form>
          </div>
        ) : (
          <button className="action-btn accent-blue" onClick={startSetup}>
            Set up 2FA
          </button>
        )}
      </div>

      <div className="content-card accent-blue">
        <h3 style={{ marginTop: 0 }}>Recent Logins</h3>
        {loginHistory.length === 0 ? (
          <p style={{ color: "#9a9ca3" }}>No login history yet.</p>
        ) : (
          <ul className="activity-list">
            {loginHistory.map((l, i) => (
              <li key={i}>
                <span>
                  {l.ip} <br />
                  <small style={{ color: "#9a9ca3" }}>{l.userAgent?.slice(0, 40)}…</small>
                </span>
                <span style={{ color: "#9a9ca3", fontSize: "0.8rem" }}>{new Date(l.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ color: "#9a9ca3", fontSize: "0.82rem", marginTop: "1rem" }}>
          Don&apos;t recognize a login above, or lost a device? Sign every device (including this one) out at once —
          you&apos;ll need to log back in everywhere afterward.
        </p>
        <button className="action-btn accent-blue" onClick={handleLogoutAllDevices} disabled={loggingOutAll}>
          {loggingOutAll ? "Logging out everywhere..." : "Log out of all devices"}
        </button>
      </div>
    </div>
  );
}
