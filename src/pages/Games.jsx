import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import TargetRaycastGame from "../components/TargetRaycastGame";

export default function Games() {
  const [result, setResult] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenge, setChallenge] = useState(null); // { targetScore, bonusCoins, claimed }
  const [bestScore, setBestScore] = useState(0);
  const { refreshUser } = useAuth();

  const loadLeaderboard = () => {
    api.get("/gamify/leaderboard/games").then(({ data }) => setLeaderboard(data.leaderboard));
  };

  const loadStatus = () => {
    api.get("/gamify/status").then(({ data }) => {
      setChallenge(data.dailyChallenge);
      setBestScore(data.bestGameScore || 0);
    });
  };

  useEffect(() => {
    loadLeaderboard();
    loadStatus();
  }, []);

  const handleGameEnd = async (score) => {
    try {
      const { data } = await api.post("/rewards/game/complete", {
        gameId: "raycast_target_v1",
        score,
      });
      let msg = `You earned ${data.coinsEarned} coins!`;
      if (data.bonusReason === "daily_challenge") msg += ` 🎯 Daily challenge bonus +${data.bonusCoins}!`;
      else if (data.bonusReason === "high_score") msg += ` 🏆 New personal best! +${data.bonusCoins} bonus!`;
      else if (data.bonusReason === "daily_challenge+high_score")
        msg += ` 🎯🏆 Challenge + new best! +${data.bonusCoins} bonus!`;
      setResult(msg);
      refreshUser();
      loadLeaderboard();
      loadStatus();
    } catch (err) {
      setResult(err.response?.data?.message || "Could not submit score");
    }
  };

  return (
    <div className="page">
      <div className="page-hero accent-purple">
        <div className="page-hero-icon">🎮</div>
        <div>
          <h2>Play & Earn</h2>
          <p>Click the floating 3D targets in 10 seconds — more hits, more coins.</p>
        </div>
      </div>

      {challenge && (
        <div className="content-card accent-purple">
          <div className="ad-progress-row">
            <span>🎯 Daily Challenge: score {challenge.targetScore}+ hits</span>
            <span>+{challenge.bonusCoins} coins</span>
          </div>
          <p style={{ margin: 0, color: challenge.claimed ? "#6ee7a0" : "#9a9ca3", fontSize: "0.9rem" }}>
            {challenge.claimed
              ? "✓ Completed today — come back tomorrow for a new challenge."
              : `Your best today counts — beat ${challenge.targetScore} hits in one round to claim the bonus.`}
          </p>
          {bestScore > 0 && (
            <p style={{ margin: "0.4rem 0 0", color: "#9a9ca3", fontSize: "0.85rem" }}>
              🏆 Your all-time best: {bestScore} hits
            </p>
          )}
        </div>
      )}

      <div className="content-card accent-purple">
        <TargetRaycastGame onGameEnd={handleGameEnd} />
        {result && <p className="info">{result}</p>}
      </div>

      <div className="content-card accent-purple">
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>🏆 This Week&apos;s Leaderboard</h3>
        <p style={{ margin: "0 0 0.75rem", color: "#9a9ca3", fontSize: "0.82rem" }}>
          A rolling 7-day tournament — top scorers earn bragging rights and a permanent spot on the board.
        </p>
        {leaderboard.length === 0 ? (
          <p style={{ color: "#9a9ca3", margin: 0 }}>No scores yet this week — be the first!</p>
        ) : (
          <ul className="leaderboard-list">
            {leaderboard.map((r) => (
              <li key={r.rank}>
                <span>
                  {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : `#${r.rank}`} {r.name}
                </span>
                <span>{r.coins} coins</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
