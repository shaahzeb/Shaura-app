import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import TargetRaycastGame from "../components/TargetRaycastGame";

export default function Games() {
  const [result, setResult] = useState("");
  const { refreshUser } = useAuth();

  const handleGameEnd = async (score) => {
    try {
      const { data } = await api.post("/rewards/game/complete", {
        gameId: "raycast_target_v1",
        score,
      });
      setResult(`You earned ${data.coinsEarned} coins!`);
      refreshUser();
    } catch (err) {
      setResult(err.response?.data?.message || "Could not submit score");
    }
  };

  return (
    <div className="page">
      <h2>Play & Earn</h2>
      <p>10 second mein floating 3D targets pe click karo — jitne zyada hit, utne zyada coins.</p>

      <TargetRaycastGame onGameEnd={handleGameEnd} />

      {result && <p className="info">{result}</p>}
    </div>
  );
}
