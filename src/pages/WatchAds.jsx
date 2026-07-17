import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Coin3D from "../components/Coin3D";
import Tilt3D from "../components/Tilt3D";

export default function WatchAds() {
  const [status, setStatus] = useState("idle"); // idle | requesting | playing | reward
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(null); // { watched, cap, coinsPerAd, cooldownRemainingMs, dailyBonusClaimed, dailyBonusCoins }
  const [cooldownMs, setCooldownMs] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const { refreshUser } = useAuth();

  const loadProgress = async () => {
    try {
      const { data } = await api.get("/rewards/ad/status");
      setProgress(data);
      setCooldownMs(data.cooldownRemainingMs || 0);
    } catch {
      // non-fatal - the watch button's own request will surface any real error
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  // Countdown ticker driven by the server's cooldownRemainingMs (not a
  // client-only timer), so it can't be bypassed by hitting the API directly.
  useEffect(() => {
    if (cooldownMs <= 0) return undefined;
    const id = setInterval(() => setCooldownMs((ms) => Math.max(0, ms - 1000)), 1000);
    return () => clearInterval(id);
  }, [cooldownMs > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const capReached = progress && progress.watched >= progress.cap;
  const cooldownSeconds = Math.ceil(cooldownMs / 1000);

  const handleWatchAd = async () => {
    setStatus("requesting");
    setMessage("");
    try {
      const { data } = await api.post("/rewards/ad/request");
      setStatus("playing");
      const sessionId = data.sessionId;

      // --------------------------------------------------------------
      // INTEGRATION POINT: this calls your rewarded ad SDK if it's been
      // loaded on window (AdMob Web, Adsterra, Unity Ads, etc). It's a
      // no-op until window.AdSDK actually exists - wire up the real SDK
      // init call here when you add the network's script tag.
      //
      // Coins are credited ONLY when the ad network's server postback
      // hits /api/postback/ad-network - never directly from this callback.
      // --------------------------------------------------------------
      if (window.AdSDK?.showRewardedAd) {
        window.AdSDK.showRewardedAd({ sessionId, onComplete: () => {} });
      }

      // For local dev/demo purposes only - simulate the ad playing so the
      // UI is testable without a real ad network hooked up yet:
      setTimeout(async () => {
        setStatus("reward");
        setShowReward(true);
        setMessage(
          "Ad session started. In production, coins arrive once the ad network confirms completion via server postback."
        );
        await refreshUser();
        await loadProgress();
        setTimeout(() => setShowReward(false), 1600);
        setTimeout(() => setStatus("idle"), 1800);
      }, 2000);
    } catch (err) {
      setStatus("idle");
      setMessage(err.response?.data?.message || "Could not start ad session");
      if (err.response?.data?.cooldownRemainingMs) {
        setCooldownMs(err.response.data.cooldownRemainingMs);
      }
      loadProgress();
    }
  };

  const isDisabled = status === "requesting" || status === "playing" || cooldownMs > 0 || capReached;

  const buttonLabel = () => {
    if (status === "playing") return "Playing ad...";
    if (status === "requesting") return "Starting...";
    if (capReached) return "Daily limit reached";
    if (cooldownMs > 0) return `Next ad in ${cooldownSeconds}s`;
    return "▶ Watch Ad";
  };

  return (
    <div className="page">
      <div className="page-hero accent-blue">
        <div className="page-hero-icon">📺</div>
        <div>
          <h2>Watch Ads to Earn</h2>
          <p>Watch a short rewarded video ad to earn coins. Daily limit applies.</p>
        </div>
      </div>

      {progress && (
        <div className="content-card accent-blue">
          <div className="ad-progress-row">
            <span>
              {progress.watched} / {progress.cap} ads watched today
            </span>
            <span>{progress.coinsPerAd} coins each</span>
          </div>
          <div className="ad-progress-track">
            <div
              className="ad-progress-fill"
              style={{ width: `${Math.min(100, (progress.watched / progress.cap) * 100)}%` }}
            />
          </div>
          {capReached ? (
            <p className="info" style={{ marginBottom: 0 }}>
              🎉 Daily limit complete! Bonus of {progress.dailyBonusCoins} coins{" "}
              {progress.dailyBonusClaimed ? "credited" : "on the way"}. Come back tomorrow for more ads.
            </p>
          ) : (
            <p className="info" style={{ marginBottom: 0, opacity: 0.75 }}>
              {progress.cap - progress.watched} ad{progress.cap - progress.watched === 1 ? "" : "s"} left to unlock
              today&apos;s +{progress.dailyBonusCoins} bonus.
            </p>
          )}
        </div>
      )}

      <div className="content-card accent-blue">
        <Tilt3D max={6} style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <div className={showReward ? "ad-coin-reward" : ""}>
              <Coin3D size={130} spin tilt={false} />
            </div>
            {showReward && progress && <span className="reward-popup">+{progress.coinsPerAd} coins</span>}
          </div>
        </Tilt3D>

        <button className="action-btn accent-blue" disabled={isDisabled} onClick={handleWatchAd}>
          {buttonLabel()}
        </button>

        {cooldownMs > 0 && !capReached && (
          <div className="ad-progress-track" style={{ marginTop: "0.75rem", height: "4px" }}>
            <div
              className="ad-progress-fill"
              style={{ width: `${100 - Math.min(100, (cooldownMs / 20000) * 100)}%` }}
            />
          </div>
        )}

        {message && <p className="info">{message}</p>}
      </div>
    </div>
  );
}
