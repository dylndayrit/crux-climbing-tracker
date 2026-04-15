import { useState, useEffect, useCallback } from "react";

const API = "";

/* ── API helper ─────────────────────────────────────────── */
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const avg = (arr) =>
  arr?.length
    ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
    : "—";

const starsFor = (arr) => {
  if (!arr?.length) return "☆☆☆☆☆";
  const v = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Array.from({ length: 5 }, (_, i) => (i < Math.round(v) ? "★" : "☆")).join("");
};

const GRADE_COLORS = {
  easy: { bg: "#e8f5e0", border: "#5a9a3a", color: "#3a7a22" },
  mid: { bg: "#e0eef8", border: "#4a7ab5", color: "#2a5a8a" },
  hard: { bg: "#fff0e0", border: "#d4603a", color: "#b04020" },
  expert: { bg: "#fce8e8", border: "#c03030", color: "#a02020" },
};

function gradeLevel(grade) {
  if (!grade) return "mid";
  const g = grade.toUpperCase();
  if (g.startsWith("V")) {
    const n = parseInt(g.slice(1));
    if (n <= 2) return "easy";
    if (n <= 5) return "mid";
    if (n <= 7) return "hard";
    return "expert";
  }
  if (g.startsWith("5.")) {
    const sub = g.slice(2);
    if (sub <= "9") return "easy";
    if (sub <= "11d") return "mid";
    if (sub <= "13a") return "hard";
    return "expert";
  }
  return "mid";
}

const HOLD_COLORS = [
  "#d4603a", "#4a7ab5", "#5a9a3a", "#e8a840",
  "#9b6bb5", "#e4ddd4", "#e06090", "#3a3028",
];

const CLIMB_TYPES = ["Bouldering", "Top Rope", "Lead", "Auto Belay", "Speed"];

/* ── Toast system ───────────────────────────────────────── */
let toastId = 0;

function Toast({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: `1.5px solid ${t.type === "ok" ? "#5a9a3a" : "#d4603a"}`,
            background: t.type === "ok" ? "#e8f5e0" : "#fff0e8",
            color: t.type === "ok" ? "#3a7a22" : "#b04020",
            fontSize: 11,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            cursor: "pointer",
            animation: "fadeIn .3s ease",
            maxWidth: 320,
          }}
        >
          {t.type === "ok" ? "// success: " : "// error: "}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Modal shell ────────────────────────────────────────── */
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(58,48,40,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff8f0",
          border: "1.5px solid #d5c8b8",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 8px 32px rgba(58,48,40,0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
          animation: "slideUp .25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Confirm dialog ─────────────────────────────────────── */
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#c03030", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11, color: "#8a7a6a", marginBottom: 14, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={onCancel} className="btn-cancel-inline">cancel</button>
          <button
            onClick={onConfirm}
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: 11, fontWeight: 700, background: "#c03030", color: "#faf6f0",
              padding: "6px 18px", border: "none", borderRadius: 7, cursor: "pointer",
            }}
          >
            delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Rating modal ───────────────────────────────────────── */
function RatingModal({ target, targetType, onSubmit, onClose }) {
  const [val, setVal] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (val === 0) return;
    setLoading(true);
    await onSubmit(val);
    setLoading(false);
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>rate</div>
        <button onClick={onClose} className="close-x">✕</button>
      </div>
      <div style={{ fontSize: 9, color: "#8a7a6a", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 }}>
        rating for {targetType}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center", margin: "2px 0 8px" }}>
        {target}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "10px 0" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setVal(n)}
            style={{
              width: 36, height: 36, borderRadius: 8, fontSize: 17,
              border: `1.5px solid ${n <= (hover || val) ? "#e8a840" : "#d5c8b8"}`,
              background: n <= (hover || val) ? "#fffae8" : "#faf6f0",
              color: n <= (hover || val) ? "#e8a840" : "#d5c8b8",
              cursor: "pointer", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              transition: "all .15s ease",
              transform: n <= (hover || val) ? "scale(1.08)" : "scale(1)",
            }}
          >
            ★
          </button>
        ))}
      </div>
      {val > 0 && (
        <div style={{ textAlign: "center", fontSize: 15, fontWeight: 700, color: "#e8a840", marginBottom: 6 }}>
          {val} / 5
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={val === 0 || loading}
        style={{
          width: "100%", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: 11, fontWeight: 700, background: val > 0 ? "#e8a840" : "#d5c8b8",
          color: "#3a3028", padding: "7px", border: "none", borderRadius: 7,
          cursor: val > 0 ? "pointer" : "default", textTransform: "uppercase",
          letterSpacing: 0.5, marginTop: 4, transition: "background .2s",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "submitting..." : "submit rating"}
      </button>
      <button onClick={onClose} className="btn-cancel-full" style={{ marginTop: 6 }}>cancel</button>
    </Modal>
  );
}

/* ── Add Gym modal ──────────────────────────────────────── */
function AddGymModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", city: "", state: "", dayPassPrice: "", climbTypes: [] });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleType = (t) =>
    setForm((f) => ({
      ...f,
      climbTypes: f.climbTypes.includes(t) ? f.climbTypes.filter((x) => x !== t) : [...f.climbTypes, t],
    }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErr("gym name is required"); return; }
    setErr(""); setLoading(true);
    try {
      await onSave({ ...form, dayPassPrice: parseFloat(form.dayPassPrice) || 0 });
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>add new <span style={{ color: "#d4603a" }}>gym</span></div>
        <button onClick={onClose} className="close-x">✕</button>
      </div>
      {err && <div className="err-banner">// error: {err}</div>}
      <label className="fl">gym name</label>
      <input className="fi" placeholder="Iron City Boulders" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label className="fl">city</label>
          <input className="fi" placeholder="Pittsburgh" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className="fl">state</label>
          <input className="fi" placeholder="PA" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
      </div>
      <label className="fl">day pass price ($)</label>
      <input className="fi" type="number" step="0.01" placeholder="18.00" value={form.dayPassPrice} onChange={(e) => setForm({ ...form, dayPassPrice: e.target.value })} />
      <label className="fl">climb types</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 3, marginBottom: 10 }}>
        {CLIMB_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className="pill-toggle"
            style={{
              borderColor: form.climbTypes.includes(t) ? "#d4603a" : "#d5c8b8",
              background: form.climbTypes.includes(t) ? "#fff0e0" : "#faf6f0",
              color: form.climbTypes.includes(t) ? "#d4603a" : "#8a7a6a",
            }}
          >
            {t.toLowerCase()}
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={loading} className="btn-primary-full" style={{ background: "#d4603a", opacity: loading ? 0.6 : 1 }}>
        {loading ? "creating..." : "create gym"}
      </button>
      <button onClick={onClose} className="btn-cancel-full">cancel</button>
    </Modal>
  );
}

/* ── Add Route modal ────────────────────────────────────── */
function AddRouteModal({ gyms, onSave, onClose }) {
  const [form, setForm] = useState({ gymID: gyms[0]?._id || "", name: "", grade: "", type: "Boulder", color: HOLD_COLORS[0] });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErr("route name is required"); return; }
    if (!form.gymID) { setErr("select a parent gym"); return; }
    setErr(""); setLoading(true);
    try { await onSave(form); } catch (e) { setErr(e.message); setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>add new <span style={{ color: "#4a7ab5" }}>route</span></div>
        <button onClick={onClose} className="close-x">✕</button>
      </div>
      {err && <div className="err-banner">// error: {err}</div>}
      <label className="fl">parent gym</label>
      <select className="fi" value={form.gymID} onChange={(e) => setForm({ ...form, gymID: e.target.value })}>
        {gyms.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
      </select>
      <label className="fl">route name</label>
      <input className="fi" placeholder="Crimson Overhang" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label className="fl">grade</label>
          <input className="fi" placeholder="V4 or 5.11a" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
        </div>
        <div>
          <label className="fl">type</label>
          <select className="fi" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Boulder</option><option>Top Rope</option><option>Lead</option><option>Speed</option>
          </select>
        </div>
      </div>
      <label className="fl">hold color</label>
      <div style={{ display: "flex", gap: 7, marginTop: 4, marginBottom: 10 }}>
        {HOLD_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setForm({ ...form, color: c })}
            style={{
              width: 18, height: 18, borderRadius: "50%", background: c, padding: 0,
              border: `2px solid ${form.color === c ? "#3a3028" : "#d5c8b8"}`,
              boxShadow: form.color === c ? "0 0 0 2.5px rgba(212,96,58,0.25)" : "none",
              cursor: "pointer", transition: "all .15s",
              transform: form.color === c ? "scale(1.15)" : "scale(1)",
            }}
          />
        ))}
      </div>
      <button onClick={handleSubmit} disabled={loading} className="btn-primary-full" style={{ background: "#4a7ab5", opacity: loading ? 0.6 : 1 }}>
        {loading ? "creating..." : "create route"}
      </button>
      <button onClick={onClose} className="btn-cancel-full">cancel</button>
    </Modal>
  );
}

/* ── Main App ───────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState("gyms");
  const [gyms, setGyms] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loadingGyms, setLoadingGyms] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  const toast = useCallback((msg, type = "ok") => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const loadGyms = useCallback(async () => {
    try { setLoadingGyms(true); setGyms(await api("/gyms")); }
    catch (e) { toast(e.message, "err"); }
    finally { setLoadingGyms(false); }
  }, [toast]);

  const loadRoutes = useCallback(async () => {
    try { setLoadingRoutes(true); setRoutes(await api("/routes")); }
    catch (e) { toast(e.message, "err"); }
    finally { setLoadingRoutes(false); }
  }, [toast]);

  useEffect(() => { loadGyms(); loadRoutes(); }, [loadGyms, loadRoutes]);

  const createGym = async (data) => {
    await api("/gyms", { method: "POST", body: JSON.stringify(data) });
    toast(`gym "${data.name}" created`); setModal(null); loadGyms();
  };
  const deleteGym = (gym) => setConfirm({
    title: "delete gym?",
    message: `"${gym.name}" and all its routes will be removed.`,
    onConfirm: async () => {
      try { await api(`/gyms/${gym._id}`, { method: "DELETE" }); toast(`gym "${gym.name}" deleted`); loadGyms(); loadRoutes(); }
      catch (e) { toast(e.message, "err"); }
      setConfirm(null);
    },
  });
  const createRoute = async (data) => {
    await api(`/gyms/${data.gymID}/routes`, { method: "POST", body: JSON.stringify({ name: data.name, grade: data.grade, type: data.type, color: data.color }) });
    toast(`route "${data.name}" created`); setModal(null); loadRoutes();
  };
  const deleteRoute = (route) => setConfirm({
    title: "delete route?",
    message: `"${route.name}" will be permanently removed.`,
    onConfirm: async () => {
      try { await api(`/gyms/${route.gymID}/routes/${route._id}`, { method: "DELETE" }); toast(`route "${route.name}" deleted`); loadRoutes(); }
      catch (e) { toast(e.message, "err"); }
      setConfirm(null);
    },
  });
  const rateGym = async (gymId, val) => {
    try { await api(`/gyms/${gymId}/ratings`, { method: "POST", body: JSON.stringify({ rating: val }) }); toast("rating submitted"); setModal(null); loadGyms(); }
    catch (e) { toast(e.message, "err"); }
  };
  const rateRoute = async (routeId, val) => {
    try { await api(`/routes/${routeId}/ratings`, { method: "POST", body: JSON.stringify({ rating: val }) }); toast("rating submitted"); setModal(null); loadRoutes(); }
    catch (e) { toast(e.message, "err"); }
  };

  const gymName = (id) => gyms.find((g) => g._id === id)?.name || "Unknown Gym";

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf6f0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #3a3028; -webkit-font-smoothing: antialiased; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { to { background: #d4603a; transform: scale(1.3); } }

        .shell { max-width: 840px; margin: 0 auto; padding: 28px 20px; }
        .nav { display: flex; gap: 0; border-bottom: 2px solid #d5c8b8; margin-bottom: 22px; }
        .nav-item {
          padding: 8px 20px; font-size: 12px; font-weight: 500; color: #8a7a6a;
          border: none; border-bottom: 2px solid transparent; margin-bottom: -2px;
          cursor: pointer; letter-spacing: 0.3px; text-transform: lowercase;
          background: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          transition: color .15s;
        }
        .nav-item:hover { color: #3a3028; }
        .nav-item.active { color: #d4603a; border-bottom-color: #d4603a; font-weight: 700; }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .title .accent { color: #d4603a; }

        .btn-add {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 11px; font-weight: 700; color: #faf6f0; padding: 7px 16px;
          border: none; border-radius: 7px; cursor: pointer; text-transform: uppercase;
          letter-spacing: 0.5px; transition: all .15s;
        }
        .btn-add:hover { filter: brightness(1.08); transform: translateY(-1px); }

        .btn-primary-full {
          width: 100%; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 11px; font-weight: 700; color: #faf6f0; padding: 7px;
          border: none; border-radius: 7px; cursor: pointer; text-transform: uppercase;
          letter-spacing: 0.5px; transition: all .15s; margin-top: 6px;
        }
        .btn-primary-full:hover { filter: brightness(1.08); }

        .btn-cancel-full {
          width: 100%; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 10px; background: transparent; color: #8a7a6a;
          padding: 5px; border: 1.5px dashed #d5c8b8; border-radius: 7px;
          cursor: pointer; transition: all .15s; margin-top: 5px;
        }
        .btn-cancel-full:hover { border-color: #8a7a6a; color: #3a3028; }

        .btn-cancel-inline {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 10px; background: transparent; color: #8a7a6a;
          padding: 6px 18px; border: 1.5px dashed #d5c8b8; border-radius: 7px;
          cursor: pointer; transition: all .15s;
        }
        .btn-cancel-inline:hover { border-color: #8a7a6a; color: #3a3028; }

        .card {
          background: #fff8f0; border-radius: 14px; padding: 14px;
          border: 1.5px solid #d5c8b8;
          box-shadow: 0 2px 8px rgba(58,48,40,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
          transition: all .2s; animation: cardIn .35s ease both;
        }
        .card:hover { box-shadow: 0 4px 16px rgba(58,48,40,0.1), inset 0 1px 0 rgba(255,255,255,0.7); transform: translateY(-2px); }
        .gym-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }

        .card-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
        .card-loc { font-size: 10px; color: #8a7a6a; margin-bottom: 8px; }
        .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
        .tag { font-size: 9px; padding: 2px 7px; border-radius: 10px; border: 1px solid; font-weight: 500; text-transform: lowercase; }
        .price { font-size: 17px; font-weight: 700; color: #5a9a3a; }
        .price-unit { font-size: 9px; color: #8a7a6a; font-weight: 400; }
        .card-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e8e0d4; padding-top: 7px; margin-top: 7px; }
        .stars { font-size: 11px; color: #e8a840; }
        .stars-ct { font-size: 9px; color: #8a7a6a; margin-left: 3px; }

        .icon-btn {
          width: 25px; height: 25px; border-radius: 6px; border: 1.5px solid #d5c8b8;
          background: #faf6f0; display: flex; align-items: center; justify-content: center;
          font-size: 11px; cursor: pointer; transition: all .15s;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        .icon-btn:hover { transform: scale(1.1); }
        .icon-btn.rate { color: #e8a840; }
        .icon-btn.rate:hover { background: #fffae8; border-color: #e8a840; }
        .icon-btn.del { color: #d4603a; }
        .icon-btn.del:hover { background: #fff0e0; border-color: #d4603a; }

        .route-row {
          background: #fff8f0; border-radius: 10px; padding: 9px 14px;
          border: 1.5px solid #d5c8b8; display: grid;
          grid-template-columns: 8px 1fr auto auto auto auto;
          align-items: center; gap: 12px;
          box-shadow: 0 2px 8px rgba(58,48,40,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
          transition: all .2s; animation: cardIn .35s ease both;
        }
        .route-row:hover { box-shadow: 0 4px 16px rgba(58,48,40,0.1); transform: translateY(-1px); }
        .route-list { display: flex; flex-direction: column; gap: 7px; }
        .pip { width: 8px; height: 30px; border-radius: 4px; }
        .rname { font-size: 12px; font-weight: 600; }
        .rgym { font-size: 9px; color: #8a7a6a; }
        .grade-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 6px; border: 1.5px solid; text-align: center; }
        .type-lbl { font-size: 9px; color: #8a7a6a; text-transform: uppercase; letter-spacing: 0.3px; }
        .rat { font-size: 11px; color: #e8a840; }

        .fl { display: block; font-size: 9px; color: #8a7a6a; text-transform: uppercase; letter-spacing: 0.5px; margin: 7px 0 2px; font-weight: 500; }
        .fi {
          width: 100%; background: #faf6f0; border: 1.5px solid #d5c8b8;
          border-radius: 5px; padding: 4px 7px;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 11px; color: #3a3028; outline: none; transition: border-color .15s;
        }
        .fi:focus { border-color: #d4603a; }
        .fi::placeholder { color: #c5b8a5; }

        .close-x {
          width: 22px; height: 22px; border-radius: 5px; border: 1.5px solid #d5c8b8;
          background: #faf6f0; display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: #8a7a6a; cursor: pointer; transition: all .15s;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        .close-x:hover { background: #fff0e0; border-color: #d4603a; color: #d4603a; }

        .err-banner {
          background: #fff0e8; border: 1.5px solid #d4603a; border-radius: 6px;
          padding: 5px 8px; font-size: 10px; color: #b04020; margin-bottom: 8px;
        }

        .pill-toggle {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 9px; padding: 3px 9px; border-radius: 12px;
          border: 1.5px solid; cursor: pointer; transition: all .15s;
        }

        .empty-state {
          text-align: center; padding: 44px 20px;
          background: #fff8f0; border: 1.5px dashed #d5c8b8; border-radius: 14px;
        }
        .empty-icon { font-size: 26px; color: #d5c8b8; margin-bottom: 8px; }
        .empty-title { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
        .empty-sub { font-size: 10px; color: #8a7a6a; margin-bottom: 12px; }

        .loading-pulse { display: flex; gap: 6px; justify-content: center; padding: 40px; }
        .loading-pulse span { width: 7px; height: 7px; border-radius: 50%; background: #d5c8b8; animation: pulse .8s ease-in-out infinite alternate; }
        .loading-pulse span:nth-child(2) { animation-delay: .15s; }
        .loading-pulse span:nth-child(3) { animation-delay: .3s; }
      `}</style>

      <Toast toasts={toasts} onDismiss={dismissToast} />
      {modal === "addGym" && <AddGymModal onSave={createGym} onClose={() => setModal(null)} />}
      {modal === "addRoute" && gyms.length > 0 && <AddRouteModal gyms={gyms} onSave={createRoute} onClose={() => setModal(null)} />}
      {modal?.type === "rateGym" && <RatingModal target={modal.gym.name} targetType="gym" onSubmit={(v) => rateGym(modal.gym._id, v)} onClose={() => setModal(null)} />}
      {modal?.type === "rateRoute" && <RatingModal target={modal.route.name} targetType="route" onSubmit={(v) => rateRoute(modal.route._id, v)} onClose={() => setModal(null)} />}
      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      <div className="shell">
        <div className="nav">
          <button className={`nav-item ${tab === "gyms" ? "active" : ""}`} onClick={() => setTab("gyms")}>gyms</button>
          <button className={`nav-item ${tab === "routes" ? "active" : ""}`} onClick={() => setTab("routes")}>routes</button>
        </div>

        {tab === "gyms" && (
          <>
            <div className="header">
              <div className="title">climbing <span className="accent">gyms</span></div>
              <button className="btn-add" style={{ background: "#d4603a" }} onClick={() => setModal("addGym")}>+ add gym</button>
            </div>
            {loadingGyms ? (
              <div className="loading-pulse"><span /><span /><span /></div>
            ) : gyms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◇</div>
                <div className="empty-title">no gyms yet</div>
                <div className="empty-sub">add your first climbing gym to get started.</div>
                <button className="btn-add" style={{ background: "#d4603a" }} onClick={() => setModal("addGym")}>+ add gym</button>
              </div>
            ) : (
              <div className="gym-grid">
                {gyms.map((gym, i) => (
                  <div className="card" key={gym._id} style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="card-name">{gym.name}</div>
                    <div className="card-loc">{gym.city}, {gym.state}</div>
                    <div className="tags">
                      {(gym.climbTypes || []).map((t) => {
                        const lc = t.toLowerCase();
                        const isB = lc.includes("boulder");
                        const isL = lc.includes("lead");
                        return (
                          <span key={t} className="tag" style={{
                            background: isB ? "#fff0e0" : isL ? "#e8f5e0" : "#e0eef8",
                            borderColor: isB ? "#d4603a" : isL ? "#5a9a3a" : "#4a7ab5",
                            color: isB ? "#d4603a" : isL ? "#5a9a3a" : "#4a7ab5",
                          }}>{t.toLowerCase()}</span>
                        );
                      })}
                    </div>
                    <div><span className="price">${gym.dayPassPrice}</span><span className="price-unit"> / day pass</span></div>
                    <div className="card-bottom">
                      <div className="stars">{starsFor(gym.ratings)}<span className="stars-ct">{avg(gym.ratings)} ({gym.ratings?.length || 0})</span></div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="icon-btn rate" onClick={() => setModal({ type: "rateGym", gym })}>★</button>
                        <button className="icon-btn del" onClick={() => deleteGym(gym)}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "routes" && (
          <>
            <div className="header">
              <div className="title">all <span className="accent">routes</span></div>
              <button className="btn-add" style={{ background: gyms.length > 0 ? "#4a7ab5" : "#d5c8b8", cursor: gyms.length > 0 ? "pointer" : "default" }}
                onClick={() => gyms.length > 0 ? setModal("addRoute") : toast("create a gym first", "err")}>+ add route</button>
            </div>
            {loadingRoutes ? (
              <div className="loading-pulse"><span /><span /><span /></div>
            ) : routes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◇</div>
                <div className="empty-title">no routes yet</div>
                <div className="empty-sub">add a route to one of your gyms to get started.</div>
                <button className="btn-add" style={{ background: "#4a7ab5" }}
                  onClick={() => gyms.length > 0 ? setModal("addRoute") : toast("create a gym first", "err")}>+ add route</button>
              </div>
            ) : (
              <div className="route-list">
                {routes.map((route, i) => {
                  const gc = GRADE_COLORS[gradeLevel(route.grade)];
                  return (
                    <div className="route-row" key={route._id} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="pip" style={{ background: route.color || "#d5c8b8" }} />
                      <div><div className="rname">{route.name}</div><div className="rgym">{gymName(route.gymID)}</div></div>
                      <div className="grade-badge" style={{ background: gc.bg, borderColor: gc.border, color: gc.color }}>{route.grade || "—"}</div>
                      <div className="type-lbl">{(route.type || "").toLowerCase()}</div>
                      <div className="rat">★ {avg(route.ratings)}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="icon-btn rate" onClick={() => setModal({ type: "rateRoute", route })}>★</button>
                        <button className="icon-btn del" onClick={() => deleteRoute(route)}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
