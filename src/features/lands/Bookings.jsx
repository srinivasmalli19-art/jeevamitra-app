import { useEffect, useState } from "react";
import { listMyBookings, listBookingRequestsForOwner, acceptBooking, rejectBooking, cancelBooking } from "./bookingsApi";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";

function StatusPill({ status }) {
  const map = { pending: "pill-gold", confirmed: "pill-green", rejected: "pill-red", cancelled: "pill-red" };
  return <span className={`pill ${map[status] || "pill-gold"}`}>{status[0].toUpperCase() + status.slice(1)}</span>;
}

export default function Bookings() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mine");
  const [mine, setMine] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  async function refresh() {
    setLoading(true);
    const [m, r] = await Promise.all([listMyBookings(user.uid), listBookingRequestsForOwner(user.uid)]);
    setMine(m); setRequests(r);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [user.uid]);

  async function handleAccept(b) {
    setErrMsg("");
    try {
      await acceptBooking(b.id, b);
      await refresh();
    } catch (err) {
      setErrMsg(err.message);
    }
  }
  async function handleReject(b) {
    await rejectBooking(b.id, b);
    await refresh();
  }
  async function handleCancel(b) {
    await cancelBooking(b.id, b);
    await refresh();
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Bookings</h1><div className="sub">Manage your requests</div></div>
      <div className="content">
        <div className="row" style={{ marginBottom: 14 }}>
          <button className={tab === "mine" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("mine")}>My bookings</button>
          <button className={tab === "requests" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("requests")}>Requests {requests.length > 0 && `(${requests.length})`}</button>
        </div>

        {errMsg && <div className="error-box">{errMsg}</div>}
        {loading && <p className="meta">Loading...</p>}

        {!loading && tab === "mine" && (mine.length === 0
          ? <div className="empty"><h3>No bookings yet</h3><p>Browse lands and send your first request.</p></div>
          : mine.map((b) => (
            <div key={b.id} className="card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="card-title">{b.landTitle}</div>
                  <div className="meta">{b.from} → {b.to}</div>
                </div>
                <StatusPill status={b.status} />
              </div>
              {(b.status === "pending" || b.status === "confirmed") && (
                <button className="btn-danger" style={{ marginTop: 10 }} onClick={() => handleCancel(b)}>Cancel</button>
              )}
            </div>
          ))
        )}

        {!loading && tab === "requests" && (requests.length === 0
          ? <div className="empty"><h3>No requests waiting</h3><p>When someone wants to book your land, it'll show up here.</p></div>
          : requests.map((b) => (
            <div key={b.id} className="card" style={{ cursor: "default" }}>
              <div className="card-title">{b.landTitle}</div>
              <div className="meta">From {b.requesterName} · {b.from} → {b.to}</div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn-danger" onClick={() => handleReject(b)}>Reject</button>
                <button className="btn-primary" onClick={() => handleAccept(b)}>Accept</button>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
