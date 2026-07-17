import { useEffect, useRef, useState } from "react";
import api from "../api";

const TYPE_ICONS = {
  reminder: "⏰",
  offer: "📝",
  withdrawal: "💸",
  achievement: "🏆",
  promo: "📣",
  security: "🔒",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const load = () => {
    api.get("/notifications").then(({ data }) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // light polling instead of a websocket
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={() => setOpen((o) => !o)} type="button">
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-dropdown glass-card">
          <div className="notif-dropdown-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p style={{ color: "#9a9ca3", fontSize: "0.85rem" }}>No notifications yet.</p>
          ) : (
            <ul className="notif-list">
              {notifications.map((n) => (
                <li key={n._id} className={n.read ? "" : "notif-unread"}>
                  <span className="notif-icon">{TYPE_ICONS[n.type] || "🔔"}</span>
                  <div>
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-body">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
