import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Coin3D from "../components/Coin3D";
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tempToken, setTempToken] = useState(null); // set once password is verified but 2FA is pending
  const [code, setCode] = useState("");
  const [captcha, setCaptcha] = useState(null); // { captchaId, question } - only shown after repeated failures
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const { login, finalizeSession } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(
        email,
        password,
        captcha ? { captchaId: captcha.captchaId, captchaAnswer } : undefined
      );
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      if (err.response?.data?.requiresCaptcha) {
        setCaptcha(err.response.data.captcha);
        setCaptchaAnswer("");
      }
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/2fa/verify-login", { tempToken, code });
      finalizeSession(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
    }
  };

  if (tempToken) {
    return (
      <div className="auth-page">
        <form onSubmit={handle2FASubmit} className="auth-form">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "-0.5rem" }}>
            <Coin3D size={56} spin tilt />
          </div>
          <h2 style={{ textAlign: "center" }}>Enter 2FA code</h2>
          {error && <p className="error">{error}</p>}
          <p style={{ color: "#9a9ca3", fontSize: "0.85rem", textAlign: "center" }}>
            Open your authenticator app and enter the 6-digit code.
          </p>
          <input placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} required />
          <button type="submit">Verify</button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "-0.5rem" }}>
          <Coin3D size={56} spin tilt />
        </div>
        <h2 style={{ textAlign: "center" }}>Log in</h2>
        {error && <p className="error">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        <button type="submit">Log in</button>
        <p>
          No account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
