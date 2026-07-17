import { useEffect, useState } from "react";
import api from "../api";

const TABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "withdrawals", label: "Withdrawals", icon: "💸" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "offers", label: "Offers", icon: "🎯" },
  { key: "submissions", label: "Submissions", icon: "📝" },
  { key: "tickets", label: "Tickets", icon: "🎫" },
  { key: "notifications", label: "Broadcast", icon: "📣" },
  { key: "analytics", label: "Analytics", icon: "📈" },
];

export default function Admin() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="page">
      <div className="page-hero accent-purple">
        <div className="page-hero-icon">🛠️</div>
        <div>
          <h2>Admin Panel</h2>
          <p>Manage users, withdrawals, offers, tickets, and platform economy.</p>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab ${tab === t.key ? "admin-tab-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "withdrawals" && <WithdrawalsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "offers" && <OffersTab />}
      {tab === "submissions" && <SubmissionsTab />}
      {tab === "tickets" && <TicketsTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
function OverviewTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/overview").then(({ data }) => setData(data));
  }, []);

  if (!data) return <p className="info">Loading overview…</p>;

  const stats = [
    { label: "Total Revenue", value: `$${data.totalRevenueUSD.toFixed(2)}` },
    { label: "Total Paid Out", value: `$${data.totalPaidOutUSD.toFixed(2)}` },
    { label: "Margin", value: `$${data.marginUSD.toFixed(2)}` },
    { label: "Pending Withdrawals", value: data.pendingWithdrawals },
    { label: "Total Users", value: data.totalUsers },
    { label: "Flagged Users", value: data.flaggedUsers },
  ];

  return (
    <div className="content-card accent-purple">
      <div className="admin-stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="admin-stat">
            <span className="admin-stat-value">{s.value}</span>
            <span className="admin-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [note, setNote] = useState({});

  const load = () => {
    api
      .get("/admin/withdrawals", { params: statusFilter === "all" ? {} : { status: statusFilter } })
      .then(({ data }) => setWithdrawals(data.withdrawals));
  };

  useEffect(load, [statusFilter]);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/withdrawals/${id}`, { status, adminNote: note[id] });
    load();
  };

  return (
    <div className="content-card accent-purple">
      <div className="wallet-filter-row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {withdrawals.length === 0 ? (
        <p style={{ color: "#9a9ca3" }}>No withdrawals here.</p>
      ) : (
        <ul className="admin-list">
          {withdrawals.map((w) => (
            <li key={w._id} className="admin-list-row">
              <div>
                <strong>{w.user?.name}</strong> <span style={{ color: "#9a9ca3" }}>({w.user?.email})</span>
                <br />
                {w.coinsRedeemed} coins → ₹{w.cashAmount} via {w.method}
                <br />
                <small style={{ color: "#9a9ca3" }}>{new Date(w.createdAt).toLocaleString()}</small>
              </div>
              {w.status === "pending" || w.status === "approved" ? (
                <div className="admin-actions">
                  <input
                    placeholder="Note (optional)"
                    value={note[w._id] || ""}
                    onChange={(e) => setNote({ ...note, [w._id]: e.target.value })}
                  />
                  {w.status === "pending" && (
                    <>
                      <button className="action-btn accent-green" onClick={() => updateStatus(w._id, "approved")}>
                        Approve
                      </button>
                      <button className="action-btn accent-orange" onClick={() => updateStatus(w._id, "rejected")}>
                        Reject
                      </button>
                    </>
                  )}
                  {w.status === "approved" && (
                    <button className="action-btn accent-green" onClick={() => updateStatus(w._id, "paid")}>
                      Mark Paid
                    </button>
                  )}
                </div>
              ) : (
                <span className={`ticket-status ticket-${w.status === "paid" ? "resolved" : "open"}`}>
                  {w.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState({});

  const load = () => {
    api.get("/admin/users").then(({ data }) => setUsers(data.users));
  };

  useEffect(load, []);

  const toggleFlag = async (u) => {
    await api.patch(`/admin/users/${u._id}/flag`, {
      flagged: !u.flagged,
      flagReason: !u.flagged ? reason[u._id] || "Manual admin review" : null,
    });
    load();
  };

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="content-card accent-purple">
      <input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem", width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #333", background: "#0f1115", color: "#fff" }}
      />
      <ul className="admin-list">
        {filtered.map((u) => (
          <li key={u._id} className="admin-list-row">
            <div>
              <strong>{u.name}</strong> {u.role === "admin" && <span className="ticket-status ticket-resolved">admin</span>}{" "}
              {u.flagged && <span className="ticket-status ticket-open">flagged</span>}
              <br />
              <span style={{ color: "#9a9ca3" }}>{u.email}</span>
              <br />
              <small style={{ color: "#9a9ca3" }}>
                Balance: {u.coinBalance} coins · Lifetime: {u.totalEarnedCoins} · Joined{" "}
                {new Date(u.createdAt).toLocaleDateString()}
              </small>
              {u.flagReason && <div style={{ fontSize: "0.78rem", color: "#f87171" }}>Reason: {u.flagReason}</div>}
            </div>
            <div className="admin-actions">
              {!u.flagged && (
                <input
                  placeholder="Flag reason"
                  value={reason[u._id] || ""}
                  onChange={(e) => setReason({ ...reason, [u._id]: e.target.value })}
                />
              )}
              <button
                className={`action-btn ${u.flagged ? "accent-green" : "accent-orange"}`}
                onClick={() => toggleFlag(u)}
              >
                {u.flagged ? "Unflag" : "Flag"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
function OffersTab() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", category: "other", rewardCoins: "", estimatedApprovalTime: "Instant" });
  const [msg, setMsg] = useState("");

  const load = () => {
    api.get("/admin/offers").then(({ data }) => setOffers(data.offers));
  };

  useEffect(load, []);

  const createOffer = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/admin/offers", { ...form, rewardCoins: Number(form.rewardCoins) });
      setMsg("Offer created and users notified.");
      setForm({ title: "", description: "", category: "other", rewardCoins: "", estimatedApprovalTime: "Instant" });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not create offer");
    }
  };

  const toggleActive = async (o) => {
    await api.patch(`/admin/offers/${o._id}`, { active: !o.active });
    load();
  };

  const deleteOffer = async (id) => {
    await api.delete(`/admin/offers/${id}`);
    load();
  };

  return (
    <>
      <div className="content-card accent-purple">
        <h3 style={{ marginTop: 0 }}>Add a new offer</h3>
        <form onSubmit={createOffer} className="withdraw-form">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="survey">Survey</option>
            <option value="app_install">App Install</option>
            <option value="signup">Signup</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
          <input
            type="number"
            placeholder="Reward coins"
            value={form.rewardCoins}
            onChange={(e) => setForm({ ...form, rewardCoins: e.target.value })}
            required
          />
          <input
            placeholder="Estimated approval time (e.g. Instant, 24-48h)"
            value={form.estimatedApprovalTime}
            onChange={(e) => setForm({ ...form, estimatedApprovalTime: e.target.value })}
          />
          <button type="submit" className="action-btn accent-purple">
            Create Offer
          </button>
        </form>
        {msg && <p className="info">{msg}</p>}
      </div>

      <div className="content-card accent-purple">
        <h3 style={{ marginTop: 0 }}>Offer catalog</h3>
        <ul className="admin-list">
          {offers.map((o) => (
            <li key={o._id} className="admin-list-row">
              <div>
                <strong>{o.title}</strong> {!o.active && <span className="ticket-status ticket-open">inactive</span>}
                <br />
                <span style={{ color: "#9a9ca3" }}>
                  {o.category} · {o.rewardCoins} coins · {o.estimatedApprovalTime}
                </span>
              </div>
              <div className="admin-actions">
                <button className="action-btn accent-blue" onClick={() => toggleActive(o)}>
                  {o.active ? "Deactivate" : "Activate"}
                </button>
                <button className="action-btn accent-orange" onClick={() => deleteOffer(o._id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
function SubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = () => {
    api
      .get("/admin/offer-submissions", { params: statusFilter === "all" ? {} : { status: statusFilter } })
      .then(({ data }) => setSubmissions(data.submissions));
  };

  useEffect(load, [statusFilter]);

  const review = async (id, status) => {
    await api.patch(`/admin/offer-submissions/${id}`, { status });
    load();
  };

  return (
    <div className="content-card accent-purple">
      <div className="wallet-filter-row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>
      {submissions.length === 0 ? (
        <p style={{ color: "#9a9ca3" }}>No submissions here.</p>
      ) : (
        <ul className="admin-list">
          {submissions.map((s) => (
            <li key={s._id} className="admin-list-row">
              <div>
                <strong>{s.user?.name}</strong> completed <strong>{s.offer?.title}</strong>
                <br />
                <span style={{ color: "#9a9ca3" }}>{s.rewardCoins} coins · {new Date(s.createdAt).toLocaleString()}</span>
              </div>
              {s.status === "pending" ? (
                <div className="admin-actions">
                  <button className="action-btn accent-green" onClick={() => review(s._id, "approved")}>
                    Approve
                  </button>
                  <button className="action-btn accent-orange" onClick={() => review(s._id, "rejected")}>
                    Reject
                  </button>
                </div>
              ) : (
                <span className={`ticket-status ticket-${s.status === "approved" ? "resolved" : "open"}`}>{s.status}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const load = () => {
    api
      .get("/admin/tickets", { params: statusFilter === "all" ? {} : { status: statusFilter } })
      .then(({ data }) => setTickets(data.tickets));
  };

  useEffect(load, [statusFilter]);

  const reply = async (id, status) => {
    await api.post(`/admin/tickets/${id}/reply`, { text: replyText || undefined, status });
    setReplyText("");
    load();
  };

  return (
    <div className="content-card accent-purple">
      <div className="wallet-filter-row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>
      <ul className="admin-list">
        {tickets.map((t) => (
          <li key={t._id} className="admin-list-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => setOpenId(openId === t._id ? null : t._id)}
            >
              <div>
                <strong>{t.subject}</strong>{" "}
                <span style={{ color: "#9a9ca3" }}>
                  ({t.user?.name} · {t.user?.email})
                </span>
              </div>
              <span className={`ticket-status ticket-${t.status}`}>{t.status}</span>
            </div>
            {openId === t._id && (
              <div style={{ marginTop: "0.75rem" }}>
                <div className="chat-window" style={{ maxHeight: "200px" }}>
                  {t.messages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.sender === "user" ? "chat-user" : "chat-ai"}`}>
                      <small style={{ opacity: 0.6, display: "block" }}>{m.sender}</small>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div className="chat-input-row" style={{ marginTop: "0.5rem" }}>
                  <input
                    placeholder="Reply as agent…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button className="action-btn accent-blue" style={{ width: "auto" }} onClick={() => reply(t._id, "pending")}>
                    Reply
                  </button>
                  <button className="action-btn accent-green" style={{ width: "auto" }} onClick={() => reply(t._id, "resolved")}>
                    Resolve
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
function NotificationsTab() {
  const [form, setForm] = useState({ title: "", body: "", type: "promo" });
  const [msg, setMsg] = useState("");

  const send = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/admin/notifications/broadcast", form);
      setMsg("Broadcast sent to all users!");
      setForm({ title: "", body: "", type: "promo" });
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send broadcast");
    }
  };

  return (
    <div className="content-card accent-purple">
      <h3 style={{ marginTop: 0 }}>Send a push notification (in-app broadcast)</h3>
      <form onSubmit={send} className="withdraw-form">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Message"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          required
        />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="promo">Promotional</option>
          <option value="offer">New offer</option>
          <option value="achievement">Achievement</option>
          <option value="reminder">Reminder</option>
        </select>
        <button type="submit" className="action-btn accent-purple">
          Send to all users
        </button>
      </form>
      {msg && <p className="info">{msg}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
function AnalyticsTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics").then(({ data }) => setData(data));
  }, []);

  if (!data) return <p className="info">Loading analytics…</p>;

  const maxSignups = Math.max(1, ...data.signupsByDay.map((d) => d.count));
  const maxRevenue = Math.max(0.01, ...data.revenueByDay.map((d) => d.revenue));

  return (
    <>
      <div className="content-card accent-purple">
        <h3 style={{ marginTop: 0 }}>Signups — last 7 days</h3>
        <div className="admin-bar-chart">
          {data.signupsByDay.map((d) => (
            <div key={d._id} className="admin-bar-col">
              <div className="admin-bar" style={{ height: `${(d.count / maxSignups) * 100}%` }} />
              <span className="admin-bar-label">{d._id.slice(5)}</span>
              <span className="admin-bar-value">{d.count}</span>
            </div>
          ))}
          {data.signupsByDay.length === 0 && <p style={{ color: "#9a9ca3" }}>No signups in the last 7 days.</p>}
        </div>
      </div>

      <div className="content-card accent-purple">
        <h3 style={{ marginTop: 0 }}>Revenue — last 7 days</h3>
        <div className="admin-bar-chart">
          {data.revenueByDay.map((d) => (
            <div key={d._id} className="admin-bar-col">
              <div className="admin-bar admin-bar-green" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
              <span className="admin-bar-label">{d._id.slice(5)}</span>
              <span className="admin-bar-value">${d.revenue.toFixed(2)}</span>
            </div>
          ))}
          {data.revenueByDay.length === 0 && <p style={{ color: "#9a9ca3" }}>No revenue in the last 7 days.</p>}
        </div>
      </div>
    </>
  );
}
