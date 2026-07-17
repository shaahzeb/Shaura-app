import { useEffect, useRef, useState } from "react";
import api from "../api";

const SUGGESTED_QUESTIONS = [
  "How do I earn coins?",
  "What's the minimum withdrawal?",
  "How long do withdrawals take?",
  "How does the referral bonus work?",
];

export default function Support() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hi! I'm Shaura's support assistant. Ask me anything about earning, withdrawals, or your account." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketMsg, setTicketMsg] = useState("");
  const [openTicketId, setOpenTicketId] = useState(null);
  const [openTicket, setOpenTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const scrollRef = useRef(null);

  const loadTickets = () => {
    api.get("/support/tickets").then(({ data }) => setTickets(data.tickets));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Polling stands in for real-time chat here (no websocket infra) - good
  // enough for "an agent replied a minute ago" without extra backend setup.
  useEffect(() => {
    if (!openTicketId) return undefined;
    const fetchTicket = () => api.get(`/support/tickets/${openTicketId}`).then(({ data }) => setOpenTicket(data.ticket));
    fetchTicket();
    const id = setInterval(fetchTicket, 5000);
    return () => clearInterval(id);
  }, [openTicketId]);

  const sendMessage = async (text) => {
    const userMsg = { sender: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/support/chat", {
        message: text,
        history: nextMessages.slice(-8), // keep the payload small
      });
      setMessages((m) => [...m, { sender: "ai", text: data.reply }]);
    } catch (err) {
      if (err.response?.data?.aiUnavailable) {
        setAiUnavailable(true);
        setMessages((m) => [
          ...m,
          { sender: "ai", text: "AI support isn't available right now — you can create a ticket below and a human will help." },
        ]);
      } else {
        setMessages((m) => [...m, { sender: "ai", text: "Something went wrong. Please try creating a ticket instead." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  const createTicket = async () => {
    try {
      const { data } = await api.post("/support/tickets", {
        subject: messages.find((m) => m.sender === "user")?.text?.slice(0, 60) || "Support request",
        transcript: messages,
      });
      setTicketMsg("Ticket created — a human agent will follow up soon.");
      loadTickets();
      setOpenTicketId(data.ticket._id);
    } catch (err) {
      setTicketMsg(err.response?.data?.message || "Could not create ticket");
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !openTicketId) return;
    setReplying(true);
    try {
      const { data } = await api.post(`/support/tickets/${openTicketId}/reply`, { text: replyText.trim() });
      setOpenTicket(data.ticket);
      setReplyText("");
      loadTickets();
    } catch (err) {
      setTicketMsg(err.response?.data?.message || "Could not send reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="page">
      <div className="page-hero accent-blue">
        <div className="page-hero-icon">🤖</div>
        <div>
          <h2>Customer Support</h2>
          <p>Chat with our AI assistant, or create a ticket for a human agent.</p>
        </div>
      </div>

      <div className="content-card accent-blue">
        <div className="chat-window" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender === "user" ? "chat-user" : "chat-ai"}`}>
              {m.text}
            </div>
          ))}
          {loading && <div className="chat-bubble chat-ai chat-typing">Typing…</div>}
        </div>

        {messages.length <= 1 && (
          <div className="suggested-row">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} type="button" className="suggested-chip" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="chat-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            disabled={loading}
          />
          <button type="submit" className="action-btn accent-blue" style={{ width: "auto" }} disabled={loading}>
            Send
          </button>
        </form>

        <button type="button" className="ticket-escalate-btn" onClick={createTicket}>
          {aiUnavailable ? "Create a support ticket" : "Still need help? Create a ticket"}
        </button>
        {ticketMsg && <p className="info">{ticketMsg}</p>}
      </div>

      {tickets.length > 0 && (
        <div className="content-card accent-blue">
          <h3 style={{ marginTop: 0 }}>Your Tickets</h3>
          <ul className="activity-list">
            {tickets.map((t) => (
              <li
                key={t._id}
                onClick={() => setOpenTicketId(openTicketId === t._id ? null : t._id)}
                style={{ cursor: "pointer" }}
              >
                <span>{t.subject}</span>
                <span className={`ticket-status ticket-${t.status}`}>{t.status}</span>
              </li>
            ))}
          </ul>

          {openTicketId && openTicket && (
            <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
              <div className="chat-window" style={{ maxHeight: "220px" }}>
                {openTicket.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`chat-bubble ${m.sender === "user" ? "chat-user" : "chat-ai"}`}
                  >
                    <small style={{ opacity: 0.6, display: "block" }}>
                      {m.sender === "agent" ? "Support agent" : m.sender === "ai" ? "AI assistant" : "You"}
                    </small>
                    {m.text}
                  </div>
                ))}
              </div>
              {openTicket.status === "resolved" ? (
                <p className="info" style={{ marginTop: "0.5rem" }}>
                  This ticket is resolved. Start a new chat above if you need more help.
                </p>
              ) : (
                <form onSubmit={sendReply} className="chat-input-row" style={{ marginTop: "0.5rem" }}>
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply to the agent…"
                    disabled={replying}
                  />
                  <button type="submit" className="action-btn accent-blue" style={{ width: "auto" }} disabled={replying}>
                    Send
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
