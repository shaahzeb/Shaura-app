import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Coin3D from "../components/Coin3D";
import Tilt3D from "../components/Tilt3D";

export default function WatchAds() {
  const [status, setStatus] = useState("idle"); // idle | requesting | playing | done
  const [message, setMessage] = useState("");
  const { refreshUser } = useAuth();

  const handleWatchAd = async () => {
    setStatus("requesting");
    setMessage("");
    try {
      const { data } = await api.post("/rewards/ad/request");
      setStatus("playing");

      // --------------------------------------------------------------
      // INTEGRATION POINT: launch your rewarded ad SDK here, passing
      // data.sessionId as the custom/reward parameter. Example (AdMob
      // Web / Adsterra / Unity Ads pseudo-call):
      //
      //   window.AdSDK.showRewardedAd({
      //     sessionId: data.sessionId,
      //     userId: user.id,
      //     onComplete: () => { /* ad network fires server-to-server
      //        postback to /api/postback/ad-network on its own */ }
      //   });
      //
      // Coins are credited ONLY when the ad network's server postback
      // hits our backend - never directly from this client callback.
      // --------------------------------------------------------------

      // For local dev/demo purposes only - simulate the ad playing:
      setTimeout(() => {
        setStatus("done");
        setMessage(
          "Ad session started. In production, coins arrive once the ad network confirms completion via server postback."
        );
        refreshUser();
      }, 2000);
    } catch (err) {
      setStatus("idle");
      setMessage(err.response?.data?.message || "Could not start ad session");
    }
  };

  return (
    <div className="page">
      <h2>Watch Ads to Earn</h2>
      <p>Watch a short rewarded video ad to earn coins. Daily limit applies.</p>

      <Tilt3D max={6} style={{ display: "flex", justifyContent: "center", margin: "1.5rem 0" }}>
        <Coin3D size={120} spin tilt={false} />
      </Tilt3D>

      <button disabled={status === "requesting" || status === "playing"} onClick={handleWatchAd}>
        {status === "playing" ? "Playing ad..." : "Watch Ad"}
      </button>

      {message && <p className="info">{message}</p>}
    </div>
  );
}
