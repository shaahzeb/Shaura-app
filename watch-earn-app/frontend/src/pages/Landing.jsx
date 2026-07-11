import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Coin3D from "../components/Coin3D";
import HeroCoinScene from "../components/HeroCoinScene";
import Tilt3D from "../components/Tilt3D";
import "./Landing.css";

// Signature element: an earnings "receipt" that prints line items one by
// one on a loop, then shows a total and a payout stamp - a visual metaphor
// that's grounded in the actual product (coins -> cash) rather than a
// generic stat-card hero.
const RECEIPT_LINES = [
  { label: "Ad Watched", amt: "+₹0.08" },
  { label: "Ad Watched", amt: "+₹0.08" },
  { label: "Quiz Completed", amt: "+₹1.20" },
  { label: "Survey Completed", amt: "+₹4.50" },
  { label: "Referral Bonus", amt: "+₹1.00" },
];

function Receipt() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => (c >= RECEIPT_LINES.length ? 1 : c + 1));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  const total = RECEIPT_LINES.slice(0, visibleCount)
    .reduce((sum, l) => sum + Number(l.amt.replace("+₹", "")), 0)
    .toFixed(2);

  return (
    <div className="receipt-wrap">
      <div className="receipt mono">
        <div className="receipt-head">SHAURA — EARNINGS RECEIPT</div>
        <div className="receipt-sub">Aaj ka hisaab</div>
        <hr className="receipt-divider" />
        {RECEIPT_LINES.slice(0, visibleCount).map((line, i) => (
          <div className="receipt-line" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
            <span>{line.label}</span>
            <span className="amt">{line.amt}</span>
          </div>
        ))}
        <hr className="receipt-divider" />
        <div className="receipt-total">
          <span>TOTAL AAJ</span>
          <span>₹{total}</span>
        </div>
        <div className="receipt-stamp">CASH OUT ANYTIME</div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Watch",
    body: "Rewarded video ads dekho — 30 second se kam mein coins seedha wallet mein.",
  },
  {
    n: "02",
    title: "Play",
    body: "Mini-games khelo, score banao, har round pe thode extra coins kamao.",
  },
  {
    n: "03",
    title: "Complete",
    body: "Surveys aur offers poore karo — sabse bade rewards yahi se aate hain.",
  },
  {
    n: "04",
    title: "Cash out",
    body: "Coins ko UPI, PayPal ya gift cards mein convert karo. Minimum payout bahut chhota rakha hai.",
  },
];

const FAQS = [
  {
    q: "Kya ye legit hai, paisa waqai milta hai?",
    a: "Haan — har coin ek verified ad-view, offer completion, ya game round se aata hai. Withdrawal request admin approval ke baad UPI/PayPal/gift card se process hoti hai.",
  },
  {
    q: "Withdrawal mein kitna time lagta hai?",
    a: "Zyadatar requests 24-48 ghante mein approve ho jaati hain. Status apni Wallet screen pe track kar sakte ho.",
  },
  {
    q: "Minimum withdrawal kitna hai?",
    a: "Bahut chhota rakha gaya hai taaki naye users bhi jaldi apna pehla payout dekh sakein — exact amount app ke andar Wallet page pe dikhta hai.",
  },
  {
    q: "Daily kitna kama sakte hain?",
    a: "Ads aur games pe daily caps hain (fair use ke liye), lekin offers complete karke usse zyada kamaya ja sakta hai. Consistency se best results milte hain.",
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <div className="faq-q" onClick={() => setOpen((o) => !o)}>
        <span>{item.q}</span>
        <span>{open ? "−" : "+"}</span>
      </div>
      {open && <p className="faq-a">{item.a}</p>}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="l-nav">
        <div className="l-logo display">
          <Coin3D size={30} spin tilt={false} />
          Shaura
        </div>
        <div className="l-nav-links">
          <a href="#how">Kaise kaam karta hai</a>
          <a href="#faq">FAQ</a>
          <Link to="/login">Login</Link>
          <Link to="/register" className="l-nav-cta">
            Free mein shuru karo
          </Link>
        </div>
      </nav>

      <section className="l-hero">
        <div>
          <div className="l-eyebrow">Real payouts, rozana</div>
          <h1 className="display">
            Dekho, khelo, <span>kamao.</span>
          </h1>
          <p className="sub">
            Ads dekhkar, mini-games khelkar aur offers complete karke coins jama karo — phir unhe seedha UPI ya
            PayPal mein cash out karo. Koi hidden catch nahi, sirf simple earning.
          </p>
          <div className="l-hero-ctas">
            <Link to="/register" className="btn-primary">
              Free account banao
            </Link>
            <a href="#how" className="btn-ghost">
              Kaise kaam karta hai
            </a>
          </div>
        </div>
        <HeroCoinScene height={420} />
      </section>

      <div className="l-strip">
        <div className="l-strip-track">
          <span>📺 REWARDED VIDEO ADS</span>
          <span>🎮 MINI-GAMES</span>
          <span>📝 SURVEYS & OFFERS</span>
          <span>💸 UPI / PAYPAL PAYOUTS</span>
          <span>🎁 REFERRAL BONUSES</span>
          <span>📺 REWARDED VIDEO ADS</span>
          <span>🎮 MINI-GAMES</span>
          <span>📝 SURVEYS & OFFERS</span>
          <span>💸 UPI / PAYPAL PAYOUTS</span>
          <span>🎁 REFERRAL BONUSES</span>
        </div>
      </div>

      <section className="l-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
        <div>
          <h2 className="display">Har coin ka hisaab.</h2>
          <p className="l-section-sub" style={{ marginBottom: 0 }}>
            Har ad view, quiz, aur survey turant tumhare account mein reflect hota hai — koi guesswork nahi, poora
            transparent ledger.
          </p>
        </div>
        <Receipt />
      </section>

      <section className="l-section" id="how">
        <h2 className="display">Chaar simple steps</h2>
        <p className="l-section-sub">Koi complicated setup nahi — sign up karo aur pehle 5 minute mein hi kamana shuru kar do.</p>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <Tilt3D key={s.n} max={8}>
              <div className="step-card">
                <div className="step-num mono">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </Tilt3D>
          ))}
        </div>
      </section>

      <section className="l-section" style={{ paddingTop: 0 }}>
        <div className="stats-row">
          <div className="stat">
            <div className="num mono">12,400+</div>
            <div className="label">Active earners</div>
          </div>
          <div className="stat">
            <div className="num mono">₹9.4L+</div>
            <div className="label">Paid out so far</div>
          </div>
          <div className="stat">
            <div className="num mono">4.8★</div>
            <div className="label">Average rating</div>
          </div>
        </div>
        <p className="stats-note">*Illustrative numbers — replace with your real, up-to-date figures before launch.</p>
      </section>

      <section className="l-section" id="faq">
        <h2 className="display">Common sawaal</h2>
        <div>
          {FAQS.map((item, i) => (
            <FaqItem item={item} key={i} />
          ))}
        </div>
      </section>

      <section className="l-final-cta">
        <h2 className="display">Aaj hi apna pehla coin kamao.</h2>
        <Link to="/register" className="btn-primary">
          Free account banao
        </Link>
      </section>

      <footer className="l-footer">© {new Date().getFullYear()} Shaura. Sabhi rights reserved.</footer>
    </div>
  );
}
