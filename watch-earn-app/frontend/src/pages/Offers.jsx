import { useEffect, useState } from "react";
import api from "../api";
import Coin3D from "../components/Coin3D";

export default function Offers() {
  const [offerUrl, setOfferUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await api.get("/rewards/offers");
        setOfferUrl(data.url);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load offers");
      }
    };
    fetchOffers();
  }, []);

  return (
    <div className="page">
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <Coin3D size={30} spin tilt={false} />
        Complete Offers to Earn
      </h2>
      <p>Finish surveys, sign-ups, or app installs to earn bigger coin rewards.</p>
      {error && <p className="error">{error}</p>}
      {offerUrl && (
        <iframe
          title="Offerwall"
          src={offerUrl}
          className="offerwall-frame"
          style={{ width: "100%", height: "600px", border: "none" }}
        />
      )}
    </div>
  );
}
