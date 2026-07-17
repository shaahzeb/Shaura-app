import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const CATEGORY_LABELS = {
  survey: "📋 Survey",
  app_install: "📲 App Install",
  signup: "✍️ Sign-up",
  video: "🎬 Video",
  other: "🎯 Other",
};

const STATUS_COLORS = {
  pending: "#facc15",
  approved: "#4ade80",
  rejected: "#f87171",
};

export default function Offers() {
  const { refreshUser } = useAuth();
  const [offers, setOffers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minReward, setMinReward] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const loadOffers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== "all") params.category = category;
      if (minReward) params.minReward = minReward;
      const { data } = await api.get("/offers/catalog", { params });
      setOffers(data.offers);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    const { data } = await api.get("/offers/my-submissions");
    setSubmissions(data.submissions);
  };

  useEffect(() => {
    loadOffers();
    loadSubmissions();
    api
      .get("/rewards/offers")
      .then(({ data }) => setExternalUrl(data.url))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(loadOffers, 350); // debounce search typing
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, minReward]);

  const pendingOfferIds = useMemo(
    () => new Set(submissions.filter((s) => s.status === "pending").map((s) => s.offer?._id)),
    [submissions]
  );

  const recommended = useMemo(() => offers.filter((o) => o.featured).slice(0, 3), [offers]);

  const handleComplete = async (offer) => {
    setMessage("");
    try {
      await api.post(`/offers/${offer._id}/complete`);
      setMessage(`Submitted "${offer.title}" for review — you'll be credited once approved.`);
      loadSubmissions();
      refreshUser();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not submit offer");
    }
  };

  return (
    <div className="page">
      <div className="page-hero accent-orange">
        <div className="page-hero-icon">📝</div>
        <div>
          <h2>Complete Offers to Earn</h2>
          <p>Finish surveys, sign-ups, or app installs for bigger coin rewards.</p>
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="content-card accent-orange">
          <h3 style={{ marginTop: 0 }}>⭐ Recommended for you</h3>
          <div className="offer-grid">
            {recommended.map((o) => (
              <div className="offer-card featured" key={o._id}>
                <span className="offer-category">{CATEGORY_LABELS[o.category]}</span>
                <h4>{o.title}</h4>
                <p>{o.description}</p>
                <div className="offer-meta">
                  <span>🪙 {o.rewardCoins} coins</span>
                  <span>⏱ {o.estimatedApprovalTime}</span>
                </div>
                <button
                  className="action-btn accent-orange"
                  disabled={pendingOfferIds.has(o._id)}
                  onClick={() => handleComplete(o)}
                >
                  {pendingOfferIds.has(o._id) ? "Pending review" : "Start Offer"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="content-card accent-orange">
        <div className="offer-filter-row">
          <input
            placeholder="🔍 Search offers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            <option value="survey">Survey</option>
            <option value="app_install">App Install</option>
            <option value="signup">Sign-up</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
          <select value={minReward} onChange={(e) => setMinReward(e.target.value)}>
            <option value="">Any reward</option>
            <option value="50">50+ coins</option>
            <option value="150">150+ coins</option>
            <option value="300">300+ coins</option>
          </select>
        </div>

        {message && <p className="info">{message}</p>}

        {loading ? (
          <div className="offer-grid">
            {[1, 2, 3].map((i) => (
              <div className="offer-card skeleton" key={i}>
                <div className="skeleton-line" style={{ width: "40%" }} />
                <div className="skeleton-line" style={{ width: "80%" }} />
                <div className="skeleton-line" style={{ width: "60%" }} />
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <p style={{ color: "#9a9ca3" }}>No offers match your filters right now.</p>
        ) : (
          <div className="offer-grid">
            {offers.map((o) => (
              <div className="offer-card" key={o._id}>
                <span className="offer-category">{CATEGORY_LABELS[o.category]}</span>
                <h4>{o.title}</h4>
                <p>{o.description}</p>
                <div className="offer-meta">
                  <span>🪙 {o.rewardCoins} coins</span>
                  <span>⏱ {o.estimatedApprovalTime}</span>
                </div>
                <button
                  className="action-btn accent-orange"
                  disabled={pendingOfferIds.has(o._id)}
                  onClick={() => handleComplete(o)}
                >
                  {pendingOfferIds.has(o._id) ? "Pending review" : "Start Offer"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {submissions.length > 0 && (
        <div className="content-card accent-orange">
          <h3 style={{ marginTop: 0 }}>Your Submissions</h3>
          <ul className="activity-list">
            {submissions.map((s) => (
              <li key={s._id}>
                <span>{s.offer?.title || "Offer"}</span>
                <strong style={{ color: STATUS_COLORS[s.status] }}>{s.status}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {externalUrl && (
        <div className="content-card accent-orange">
          <h3 style={{ marginTop: 0 }}>More offers from our partner network</h3>
          <iframe
            title="Offerwall"
            src={externalUrl}
            className="offerwall-frame"
            style={{ width: "100%", height: "500px", border: "none" }}
          />
        </div>
      )}
    </div>
  );
}
