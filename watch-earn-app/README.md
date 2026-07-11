# Watch & Earn — Starter Scaffold

A rewards app where users earn coins by watching ads, playing mini-games, and
completing offers, and you (the owner) earn revenue from ad networks and
offerwall commissions.

## Structure

```
watch-earn-app/
├── docker-compose.yml   Local dev: spins up MongoDB + backend together
├── backend/             Node/Express/MongoDB API
│   ├── models/           User, Transaction, Withdrawal schemas
│   ├── routes/           auth, rewards, postback, withdraw, admin
│   ├── middleware/       JWT auth + admin guard, postback IP whitelist
│   ├── utils/            reward helpers, coin crediting, ad-session store
│   ├── Dockerfile
│   └── server.js
└── frontend/            React app
    ├── vercel.json       SPA routing for Vercel deploys
    ├── public/_redirects SPA routing for Netlify deploys
    └── src/
        ├── pages/         Landing, Login, Register, Dashboard, WatchAds, Games, Offers, Wallet
        ├── components/    Coin3D, HeroCoinScene, AmbientCoinBackground, Tilt3D, TargetRaycastGame
        ├── utils/         coin3d.js - shared three.js mesh/lighting helpers
        ├── context/       AuthContext
        └── api.js         Axios client with JWT injection
```

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, ad network keys
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

## 3D branding (Shaura) — the whole platform

Every layer of the UI now uses real WebGL/3D instead of flat CSS:

- `components/Coin3D.jsx` — single spinning gold coin, used as the small
  logo/icon wherever the brand mark appears (nav, dashboard header, wallet,
  login/register).
- `components/HeroCoinScene.jsx` — landing page hero centerpiece: one large
  coin with three smaller coins orbiting it, tilting toward the cursor.
- `components/AmbientCoinBackground.jsx` — a fixed, full-viewport WebGL
  scene of slowly drifting coins mounted once at the app root (`App.jsx`,
  outside `<Routes>`), so every page sits on top of the same persistent
  ambient scene instead of paying for a new one per route.
- `components/Tilt3D.jsx` — wraps any card/button/panel to get a real
  cursor-tracked perspective tilt (`rotateX`/`rotateY`, not just a flat
  hover state). Applied to the dashboard's balance card and all four
  earn-cards, and the landing page's step cards.
- `components/TargetRaycastGame.jsx` — the Games page is now a real 3D
  game: gold icosahedron targets float in a WebGL scene, clicks are
  resolved with a `Raycaster` hit-test (not a flat HTML button), hit
  targets respawn elsewhere, and the hit-count becomes the score submitted
  to `/rewards/game/complete`.
- `utils/coin3d.js` — shared mesh/texture/lighting helpers so every coin
  component builds its coins the same way (metallic gold material, an
  engraved letter face drawn onto a canvas texture, a warm three-point
  lighting rig).

If you add more 3D surfaces later, reuse `createCoinMesh`/`addCoinLighting`
from `utils/coin3d.js` rather than duplicating the WebGL boilerplate.

### Performance note

Every `Coin3D`/`HeroCoinScene`/`AmbientCoinBackground`/`TargetRaycastGame`
instance opens its own WebGL context. A page like the dashboard can have
3-4 contexts running at once (ambient background + header coin + balance
coin + earn-card icons if you add more). This is fine on modern phones but
worth watching on low-end devices — if it becomes an issue, the fix is
sharing a single renderer/context across coins rather than one per
component, or dropping `AmbientCoinBackground` on pages that already have
a lot of other 3D on screen.

## Deployment

### Option A — local with Docker (fastest way to see it running)

```bash
docker compose up --build
```

This starts MongoDB + the backend together (backend on `:5000`). Then run the
frontend separately:

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

### Option B — production

1. **Database**: create a free cluster on MongoDB Atlas, get the connection
   string, put it in the backend's `MONGO_URI`.
2. **Backend**: deploy the `backend/` folder to Render, Railway, or Fly.io
   (the included `Dockerfile` works on any of them). Set all the env vars
   from `.env.example` in the platform's dashboard — don't commit `.env`.
3. **Frontend**: deploy the `frontend/` folder to Vercel or Netlify. Set
   `REACT_APP_API_URL` to your deployed backend's URL (e.g.
   `https://your-api.onrender.com/api`). The included `vercel.json` /
   `public/_redirects` handle client-side routing so refreshing
   `/dashboard` etc. doesn't 404.
4. **CORS**: set `FRONTEND_URL` on the backend to your deployed frontend's
   exact URL, or the API will reject requests from it.
5. **Postback URLs**: once you have real ad network / offerwall accounts,
   register `https://your-api.onrender.com/api/postback/ad-network` and
   `.../postback/offerwall` with them as the callback URL.

## Security hardening already in the code

- **Ad-view sessions are server-tracked and single-use** (`utils/sessionStore.js`)
  — `POST /rewards/ad/request` issues a session id tied to the user, and the
  postback must present that exact session id or it's rejected. This stops
  someone from replaying an old postback or forging one with a guessed user id.
- **IP whitelisting for postback routes** (`middleware/ipWhitelist.js`) — set
  `AD_NETWORK_ALLOWED_IPS` / `OFFERWALL_ALLOWED_IPS` once you know your
  provider's outgoing IPs; skipped automatically if left blank so local dev
  isn't blocked.
- **CORS is locked to `FRONTEND_URL`** instead of wide open.
- **Startup env validation** — the server refuses to start if `MONGO_URI` or
  `JWT_SECRET` is missing, instead of failing confusingly later.
- **Global error handler + 404 handler** so unexpected errors return clean
  JSON instead of crashing the process or leaking a stack trace.

## What's still on you (can't be done from here)

- **Signing up for real ad network / offerwall provider accounts** (AdMob,
  Adsterra, Unity Ads, AdGate Media, OfferToro, Torox, etc.) — this needs
  your own business details/bank info, and each has its own approval
  process. Once approved, swap their real postback parameter names into
  `routes/postback.js` (the shape is documented in comments there).
- **A domain + DNS** if you want something nicer than the free subdomain
  Render/Vercel give you.
- **A payout method** (Razorpay/UPI payouts API, PayPal Payouts API) to
  automate marking withdrawals "paid" instead of doing it by hand from the
  admin panel.
- **Legal/compliance review** for cash payouts and ad-tracking consent in
  whichever markets you launch in — this is a real-money product, so it's
  worth having someone check that before opening it up publicly.

## Routing / flow

`/` is now a public marketing landing page (`pages/Landing.jsx`) — it explains
how the app works and has "Free account banao" / "Login" CTAs. Those lead to
`/register` and `/login`, which on success drop the user straight into the
existing `/dashboard`. Update the placeholder stats in `Landing.jsx`
(`12,400+ active earners`, `₹9.4L+ paid out`, etc.) with your real numbers
before launch — they're marked as illustrative in the code.

## How the money flow works

1. **Ad views**: user clicks "Watch Ad" → frontend calls `POST /rewards/ad/request`
   to check the daily cap and get a session id → your rewarded-ad SDK
   (AdMob/Adsterra/Unity Ads) plays the ad → **the ad network itself calls your
   backend server-to-server** at `GET /postback/ad-network` once the view is
   verified → THAT callback is what credits coins. The frontend never credits
   coins directly — this is the core anti-fraud pattern.

2. **Offers**: `GET /rewards/offers` returns an iframe URL to your offerwall
   provider (AdGate Media, OfferToro, Torox) with the user's id embedded as a
   sub/click id. When the user finishes an offer, the provider calls
   `GET /postback/offerwall` server-to-server, which credits coins and logs
   your real commission revenue.

3. **Games**: since there's no external network verifying game scores, the
   backend enforces a daily earning cap (`DAILY_GAME_EARN_CAP`) to blunt
   farming. For anything with real money on the line, consider validating
   game state server-side rather than trusting the reported score.

4. **Withdrawals**: users request a payout from their coin balance; coins are
   deducted immediately and the request sits in `pending` until an admin
   approves/rejects/marks it paid via `/admin/withdrawals`.

5. **Your margin**: `admin/overview` sums `revenueEarnedUSD` from every
   `ad_view`/`offer_complete` transaction (what the ad network/offerwall
   actually paid you) against total `paid` withdrawals (what you paid users).
   The gap is your profit — tune the coin-crediting formulas in
   `routes/postback.js` to control that margin.
