import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Coin3D from "../components/Coin3D";
import Tilt3D from "../components/Tilt3D";
import AnimatedCounter from "../components/AnimatedCounter";
import NotificationBell from "../components/NotificationBell";
import api from "../api";
import { coinsToCurrency } from "../utils/currency";

const BADGE_LABELS = {
  first_coin: { label: "First Coin", icon: "🪙" },
  century: { label: "Century Club", icon: "💯" },
  streak_7: { label: "7-Day Streak", icon: "🔥" },
  streak_30: { label: "30-Day Streak", icon: "🌟" },
  big_earner: { label: "Big Earner", icon: "💎" },
};

const ACTIVITY_LABELS = {
  ad_view: { icon: "📺", label: "Ad watched" },
  game_play: { icon: "🎮", label: "Game played" },
  offer_complete: { icon: "📝", label: "Offer completed" },
  referral_bonus: { icon: "🙌", label: "Referral bonus" },
  withdrawal: { icon: "💸", label: "Withdrawal" },
  admin_adjustment: { icon: "🎁", label: "Bonus" },
  daily_ad_bonus: { icon: "🎉", label: "Daily ad bonus" },
};

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [activity, setActivity] = useState([]);
  const [checkinMsg, setCheckinMsg] = useState("");
  const [referralLeaders, setReferralLeaders] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [spinMsg, setSpinMsg] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [boxMsg, setBoxMsg] = useState("");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    api.get("/gamify/status").then(({ data }) => setStatus(data));
    api.get("/gamify/activity").then(({ data }) => setActivity(data.transactions));
    api.get("/gamify/leaderboard/referrals").then(({ data }) => setReferralLeaders(data.leaderboard));
    api.get("/gamify/referral-stats").then(({ data }) => setReferralStats(data));
  }, []);

  if (!user) return null;

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;

  const handleCheckIn = async () => {
    try {
      const { data } = await api.post("/gamify/checkin");
      setCheckinMsg(data.message);
      refreshUser();
      const { data: newStatus } = await api.get("/gamify/status");
      setStatus(newStatus);
    } catch (err) {
      setCheckinMsg(err.response?.data?.message || "Could not check in");
    }
  };

  const handleSpin = async () => {
    setSpinning(true);
    setSpinMsg("");
    try {
      const { data } = await api.post("/gamify/spin");
      setTimeout(async () => {
        setSpinMsg(data.message);
        setSpinning(false);
        refreshUser();
        const { data: newStatus } = await api.get("/gamify/status");
        setStatus(newStatus);
      }, 1200);
    } catch (err) {
      setSpinning(false);
      setSpinMsg(err.response?.data?.message || "Could not spin");
    }
  };

  const handleMysteryBox = async () => {
    setOpening(true);
    setBoxMsg("");
    try {
      const { data } = await api.post("/gamify/mystery-box");
      setTimeout(async () => {
        setBoxMsg(data.message);
        setOpening(false);
        refreshUser();
        const { data: newStatus } = await api.get("/gamify/status");
        setStatus(newStatus);
      }, 900);
    } catch (err) {
      setOpening(false);
      setBoxMsg(err.response?.data?.message || "Could not open box");
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Coin3D size={28} spin tilt={false} />
          Hey, {user.name}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <NotificationBell />
          {user.role === "admin" && (
            <Link to="/admin" className="header-icon-link" title="Admin Panel">
              🛠️
            </Link>
          )}
          <Link to="/security" className="header-icon-link" title="Security">
            🔒
          </Link>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      {/* Balance + level */}
      <Tilt3D max={6}>
        <div className="balance-card glass-card">
          <p>Coin Balance</p>
          <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
            <AnimatedCounter value={user.coinBalance || 0} />
            <Coin3D size={44} spin tilt={false} />
          </h1>
          <p className="balance-currency">≈ {coinsToCurrency(user.coinBalance)}</p>

          {status && (
            <div className="level-block">
              <div className="level-row">
                <span className="level-badge">{status.level.name}</span>
                {status.level.next && <span className="level-next">Next: {status.level.next}</span>}
              </div>
              <div className="level-track">
                <div className="level-fill" style={{ width: `${status.level.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </Tilt3D>

      {/* Daily check-in / streak */}
      {status && (
        <div className="glass-card streak-card">
          <div>
            <p className="streak-title">🔥 {status.streak.current}-day streak</p>
            <p className="streak-sub">Longest: {status.streak.longest} days</p>
          </div>
          <button
            className="action-btn accent-orange"
            disabled={!status.streak.canCheckInToday}
            onClick={handleCheckIn}
          >
            {status.streak.canCheckInToday ? "Claim Daily Reward" : "✓ Claimed Today"}
          </button>
        </div>
      )}
      {checkinMsg && <p className="info" style={{ textAlign: "center" }}>{checkinMsg}</p>}

      {/* Today's progress */}
      {status && (
        <div className="today-progress-row">
          <div className="today-stat glass-card">
            <span className="today-stat-icon">📺</span>
            <span className="today-stat-num">{status.today.adsWatched}</span>
            <span className="today-stat-label">Ads watched</span>
          </div>
          <div className="today-stat glass-card">
            <span className="today-stat-icon">🎮</span>
            <span className="today-stat-num">{status.today.gamesPlayed}</span>
            <span className="today-stat-label">Games played</span>
          </div>
          <div className="today-stat glass-card">
            <span className="today-stat-icon">📝</span>
            <span className="today-stat-num">{status.today.offersCompleted}</span>
            <span className="today-stat-label">Offers done</span>
          </div>
        </div>
      )}

      {/* Spin wheel + mystery box */}
      {status && (
        <div className="today-progress-row">
          <div className="glass-card daily-game-card">
            <span style={{ fontSize: "1.8rem" }} className={spinning ? "spin-anim" : ""}>
              🎡
            </span>
            <p style={{ margin: "0.4rem 0", fontWeight: 700 }}>Daily Spin</p>
            <button
              className="action-btn accent-purple"
              disabled={!status.canSpinToday || spinning}
              onClick={handleSpin}
            >
              {spinning ? "Spinning..." : status.canSpinToday ? "Spin Now" : "✓ Done Today"}
            </button>
            {spinMsg && <p className="info" style={{ fontSize: "0.8rem" }}>{spinMsg}</p>}
          </div>
          <div className="glass-card daily-game-card">
            <span style={{ fontSize: "1.8rem" }} className={opening ? "spin-anim" : ""}>
              🎁
            </span>
            <p style={{ margin: "0.4rem 0", fontWeight: 700 }}>Mystery Box</p>
            <button
              className="action-btn accent-orange"
              disabled={!status.canOpenMysteryBoxToday || opening}
              onClick={handleMysteryBox}
            >
              {opening ? "Opening..." : status.canOpenMysteryBoxToday ? "Open Box" : "✓ Done Today"}
            </button>
            {boxMsg && <p className="info" style={{ fontSize: "0.8rem" }}>{boxMsg}</p>}
          </div>
        </div>
      )}

      {/* Earn actions */}
      <div className="earn-grid">
        <Tilt3D max={10}>
          <Link to="/watch-ads" className="earn-card accent-blue glass-card">
            <span className="icon-circle">📺</span>
            <h3>Watch Ads</h3>
            <p>Earn coins per completed ad</p>
          </Link>
        </Tilt3D>
        <Tilt3D max={10}>
          <Link to="/games" className="earn-card accent-purple glass-card">
            <span className="icon-circle">🎮</span>
            <h3>Play Games</h3>
            <p>Score points, earn coins</p>
          </Link>
        </Tilt3D>
        <Tilt3D max={10}>
          <Link to="/offers" className="earn-card accent-orange glass-card">
            <span className="icon-circle">📝</span>
            <h3>Complete Offers</h3>
            <p>Surveys, sign-ups, installs</p>
          </Link>
        </Tilt3D>
        <Tilt3D max={10}>
          <Link to="/wallet" className="earn-card accent-green glass-card">
            <span className="icon-circle">💰</span>
            <h3>Wallet</h3>
            <p>Withdraw your earnings</p>
          </Link>
        </Tilt3D>
      </div>

      {/* Support quick access */}
      <Link to="/support" className="support-quick-link glass-card">
        <span>🤖</span>
        <div>
          <strong>Need help?</strong>
          <p>Chat with our AI support assistant</p>
        </div>
        <span className="support-arrow">→</span>
      </Link>

      {/* Badges */}
      {status && status.badges.length > 0 && (
        <div className="glass-card">
          <h3 style={{ marginTop: 0 }}>Achievements</h3>
          <div className="badge-row">
            {status.badges.map((id) => (
              <div className="badge-chip" key={id}>
                <span>{BADGE_LABELS[id]?.icon || "🏅"}</span>
                {BADGE_LABELS[id]?.label || id}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {activity.length > 0 && (
        <div className="glass-card">
          <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
          <ul className="activity-list">
            {activity.map((t) => (
              <li key={t._id}>
                <span>
                  {ACTIVITY_LABELS[t.type]?.icon || "•"} {ACTIVITY_LABELS[t.type]?.label || t.type}
                </span>
                <span className={t.coins >= 0 ? "activity-pos" : "activity-neg"}>
                  {t.coins >= 0 ? "+" : ""}
                  {t.coins} coins
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Referral */}
      <div className="referral-box glass-card">
        <div className="referral-text">
          <span className="referral-emoji">🙌</span>
          <div>
            <p className="referral-headline">
              Invite friends & earn <strong>100 coins</strong> per signup!
            </p>
          </div>
        </div>
        {referralStats && (
          <div className="today-progress-row" style={{ marginTop: "0.75rem" }}>
            <div className="today-stat glass-card">
              <span className="today-stat-icon">🙌</span>
              <span className="today-stat-num">{referralStats.directReferrals}</span>
              <span className="today-stat-label">Invites</span>
            </div>
            <div className="today-stat glass-card">
              <span className="today-stat-icon">🪙</span>
              <span className="today-stat-num">{referralStats.totalReferralEarnings}</span>
              <span className="today-stat-label">Coins earned</span>
            </div>
            <div className="today-stat glass-card">
              <span className="today-stat-icon">🎁</span>
              <span className="today-stat-num">{referralStats.referralBonusCount}</span>
              <span className="today-stat-label">Bonuses</span>
            </div>
          </div>
        )}
      </div>

      <div className="referral-code-row">
        <div className="referral-code-chip">
          <span className="referral-code-label">Your code</span>
          <span className="referral-code-value">{user.referralCode}</span>
        </div>
        <button
          className="invite-btn"
          onClick={() => {
            navigator.clipboard?.writeText(referralLink);
          }}
        >
          Copy link
        </button>
      </div>

      <input readOnly value={referralLink} className="referral-link-input" onClick={(e) => e.target.select()} />

      <div className="share-row">
        <a
          className="share-btn share-whatsapp"
          href={`https://wa.me/?text=${encodeURIComponent(
            `Watch ads, play games & earn real cash on Shaura! Use my code ${user.referralCode} to sign up: ${referralLink}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <a
          className="share-btn share-telegram"
          href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(
            `Watch ads, play games & earn real cash on Shaura! Use my code ${user.referralCode}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </a>
        <button
          type="button"
          className="share-btn share-instagram"
          onClick={() => {
            navigator.clipboard?.writeText(referralLink);
            alert("Link copied! Instagram doesn't support pre-filled share links — paste it into your Story or bio.");
          }}
        >
          Instagram
        </button>
        {navigator.share && (
          <button
            type="button"
            className="share-btn share-more"
            onClick={() =>
              navigator.share({
                title: "Shaura",
                text: `Watch ads, play games & earn real cash on Shaura! Use my code ${user.referralCode}`,
                url: referralLink,
              })
            }
          >
            More
          </button>
        )}
      </div>

      {referralLeaders.length > 0 && (
        <div className="glass-card">
          <h3 style={{ marginTop: 0 }}>Top Referrers</h3>
          <ul className="leaderboard-list">
            {referralLeaders.map((r) => (
              <li key={r.rank}>
                <span>
                  #{r.rank} {r.name}
                </span>
                <span>{r.referrals} invites</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
