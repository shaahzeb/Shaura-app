import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Coin3D from "../components/Coin3D";
import HeroCoinScene from "../components/HeroCoinScene";
import Tilt3D from "../components/Tilt3D";
import "./Landing.css";

// ---------------------------------------------------------------------------
// Translations. English is the default language; Hindi (Hinglish-flavoured,
// matching how the target audience actually talks) is a toggle. Add more
// languages here later by adding another key alongside "en"/"hi".
// ---------------------------------------------------------------------------
const COPY = {
  en: {
    navHow: "How it works",
    navFaq: "FAQ",
    navLogin: "Login",
    navCta: "Start for free",
    eyebrow: "Real payouts, daily",
    heroTitle: "Watch, play,",
    heroTitleHighlight: "earn.",
    heroSub:
      "Earn coins by watching ads, playing mini-games, and completing offers — then cash out straight to UPI or PayPal. No hidden catch, just simple earning.",
    ctaPrimary: "Create free account",
    ctaSecondary: "See how it works",
    receiptSub: "Today's earnings",
    receiptTotal: "TOTAL TODAY",
    receiptStamp: "CASH OUT ANYTIME",
    ledgerTitle: "Every coin, accounted for.",
    ledgerSub:
      "Every ad view, quiz, and survey reflects in your account instantly — no guesswork, a fully transparent ledger.",
    stepsTitle: "Four simple steps",
    stepsSub: "No complicated setup — sign up and start earning within 5 minutes.",
    steps: [
      { n: "01", title: "Watch", body: "Watch rewarded video ads — coins land in your wallet in under 30 seconds." },
      { n: "02", title: "Play", body: "Play mini-games, chase a high score, earn a few extra coins each round." },
      { n: "03", title: "Complete", body: "Finish surveys and offers — this is where the biggest rewards come from." },
      { n: "04", title: "Cash out", body: "Convert coins to UPI, PayPal, or gift cards. Minimum payout is kept low." },
    ],
    statsNote: "*Illustrative numbers — replace with your real, up-to-date figures before launch.",
    faqTitle: "Common questions",
    faqs: [
      {
        q: "Is this legit — do I actually get paid?",
        a: "Yes — every coin comes from a verified ad view, offer completion, or game round. Withdrawal requests are processed via UPI/PayPal/gift card after admin approval.",
      },
      {
        q: "How long do withdrawals take?",
        a: "Most requests are approved within 24-48 hours. You can track the status on your Wallet screen.",
      },
      {
        q: "What's the minimum withdrawal?",
        a: "It's kept low so new users can see their first payout quickly — the exact amount is shown on the Wallet page in the app.",
      },
      {
        q: "How much can I earn daily?",
        a: "Ads and games have daily caps for fair use, but completing offers can earn more than that. Consistency gets the best results.",
      },
    ],
    finalCtaTitle: "Earn your first coin today.",
    footer: "All rights reserved.",
  },
  hi: {
    navHow: "Kaise kaam karta hai",
    navFaq: "FAQ",
    navLogin: "Login",
    navCta: "Free mein shuru karo",
    eyebrow: "Real payouts, rozana",
    heroTitle: "Dekho, khelo,",
    heroTitleHighlight: "kamao.",
    heroSub:
      "Ads dekhkar, mini-games khelkar aur offers complete karke coins jama karo — phir unhe seedha UPI ya PayPal mein cash out karo. Koi hidden catch nahi, sirf simple earning.",
    ctaPrimary: "Free account banao",
    ctaSecondary: "Kaise kaam karta hai",
    receiptSub: "Aaj ka hisaab",
    receiptTotal: "TOTAL AAJ",
    receiptStamp: "CASH OUT ANYTIME",
    ledgerTitle: "Har coin ka hisaab.",
    ledgerSub:
      "Har ad view, quiz, aur survey turant tumhare account mein reflect hota hai — koi guesswork nahi, poora transparent ledger.",
    stepsTitle: "Chaar simple steps",
    stepsSub: "Koi complicated setup nahi — sign up karo aur pehle 5 minute mein hi kamana shuru kar do.",
    steps: [
      { n: "01", title: "Watch", body: "Rewarded video ads dekho — 30 second se kam mein coins seedha wallet mein." },
      { n: "02", title: "Play", body: "Mini-games khelo, score banao, har round pe thode extra coins kamao." },
      { n: "03", title: "Complete", body: "Surveys aur offers poore karo — sabse bade rewards yahi se aate hain." },
      { n: "04", title: "Cash out", body: "Coins ko UPI, PayPal ya gift cards mein convert karo. Minimum payout bahut chhota rakha hai." },
    ],
    statsNote: "*Ye numbers sirf example hain — launch se pehle apne real figures se replace karo.",
    faqTitle: "Common sawaal",
    faqs: [
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
    ],
    finalCtaTitle: "Aaj hi apna pehla coin kamao.",
    footer: "Sabhi rights reserved.",
  },
};

const RECEIPT_LINES = [
  { label: "Ad Watched", amt: "+₹0.08" },
  { label: "Ad Watched", amt: "+₹0.08" },
  { label: "Quiz Completed", amt: "+₹1.20" },
  { label: "Survey Completed", amt: "+₹4.50" },
  { label: "Referral Bonus", amt: "+₹1.00" },
];

function Receipt({ t }) {
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
        <div className="receipt-sub">{t.receiptSub}</div>
        <hr className="receipt-divider" />
        {RECEIPT_LINES.slice(0, visibleCount).map((line, i) => (
          <div className="receipt-line" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
            <span>{line.label}</span>
            <span className="amt">{line.amt}</span>
          </div>
        ))}
        <hr className="receipt-divider" />
        <div className="receipt-total">
          <span>{t.receiptTotal}</span>
          <span>₹{total}</span>
        </div>
        <div className="receipt-stamp">{t.receiptStamp}</div>
      </div>
    </div>
  );
}

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
  const [lang, setLang] = useState(() => localStorage.getItem("shaura_lang") || "en");
  const t = COPY[lang];

  const toggleLang = () => {
    const next = lang === "en" ? "hi" : "en";
    setLang(next);
    localStorage.setItem("shaura_lang", next);
  };

  return (
    <div className="landing-page">
      <nav className="l-nav">
        <div className="l-logo display">
          <Coin3D size={30} spin tilt={false} />
          Shaura
        </div>
        <div className="l-nav-links">
          <a href="#how">{t.navHow}</a>
          <a href="#faq">{t.navFaq}</a>
          <button className="lang-toggle" onClick={toggleLang} type="button">
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <Link to="/login">{t.navLogin}</Link>
          <Link to="/register" className="l-nav-cta">
            {t.navCta}
          </Link>
        </div>
      </nav>

      <section className="l-hero">
        <div>
          <div className="l-eyebrow">{t.eyebrow}</div>
          <h1 className="display">
            {t.heroTitle} <span>{t.heroTitleHighlight}</span>
          </h1>
          <p className="sub">{t.heroSub}</p>
          <div className="l-hero-ctas">
            <Link to="/register" className="btn-primary">
              {t.ctaPrimary}
            </Link>
            <a href="#how" className="btn-ghost">
              {t.ctaSecondary}
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

      <section
        className="l-section"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}
      >
        <div>
          <h2 className="display">{t.ledgerTitle}</h2>
          <p className="l-section-sub" style={{ marginBottom: 0 }}>
            {t.ledgerSub}
          </p>
        </div>
        <Receipt t={t} />
      </section>

      <section className="l-section" id="how">
        <h2 className="display">{t.stepsTitle}</h2>
        <p className="l-section-sub">{t.stepsSub}</p>
        <div className="steps-grid">
          {t.steps.map((s) => (
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
        <p className="stats-note">{t.statsNote}</p>
      </section>

      <section className="l-section" id="faq">
        <h2 className="display">{t.faqTitle}</h2>
        <div>
          {t.faqs.map((item, i) => (
            <FaqItem item={item} key={i} />
          ))}
        </div>
      </section>

      <section className="l-final-cta">
        <h2 className="display">{t.finalCtaTitle}</h2>
        <Link to="/register" className="btn-primary">
          {t.ctaPrimary}
        </Link>
      </section>

      <footer className="l-footer">
        © {new Date().getFullYear()} Shaura. {t.footer}
      </footer>
    </div>
  );
}
