import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Coin3D from "../components/Coin3D";
import Tilt3D from "../components/Tilt3D";

export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Coin3D size={28} spin tilt={false} />
          Hey, {user.name}
        </h2>
        <button onClick={logout}>Log out</button>
      </header>

      <Tilt3D max={6}>
        <div className="balance-card">
          <p>Coin Balance</p>
          <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
            {user.coinBalance?.toLocaleString()}
            <Coin3D size={44} spin tilt={false} />
          </h1>
        </div>
      </Tilt3D>

      <div className="earn-grid">
        <Tilt3D max={10}>
          <Link to="/watch-ads" className="earn-card">
            <span>📺</span>
            <h3>Watch Ads</h3>
            <p>Earn coins per completed ad</p>
          </Link>
        </Tilt3D>
        <Tilt3D max={10}>
          <Link to="/games" className="earn-card">
            <span>🎮</span>
            <h3>Play Games</h3>
            <p>Score points, earn coins</p>
          </Link>
        </Tilt3D>
        <Tilt3D max={10}>
          <Link to="/offers" className="earn-card">
            <span>📝</span>
            <h3>Complete Offers</h3>
            <p>Surveys, sign-ups, installs</p>
          </Link>
        </Tilt3D>
        <Tilt3D max={10}>
          <Link to="/wallet" className="earn-card">
            <span>💰</span>
            <h3>Wallet</h3>
            <p>Withdraw your earnings</p>
          </Link>
        </Tilt3D>
      </div>

      <div className="referral-box">
        <p>Invite friends & earn 100 coins per signup:</p>
        <input readOnly value={referralLink} onClick={(e) => e.target.select()} />
      </div>
    </div>
  );
}
