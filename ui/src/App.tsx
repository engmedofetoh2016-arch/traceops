import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import AlertsPage from "./pages/AlertsPage";
import LoginPage from "./pages/LoginPage";
import { clearToken, getToken, listAlerts } from "./lib/api";
import type { ReactNode } from "react";


function RequireAuth({ children }: { children: ReactNode }) { 
   return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [alertCount, setAlertCount] = useState<number>(0);
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      if (!getToken()) return; // don't call alerts if not logged in
      try {
        const res = await listAlerts({ resolved: false, limit: 1, offset: 0 });
        if (!cancelled) setAlertCount(res.paging.total);
      } catch {
        if (!cancelled) setAlertCount(0);
      }
    }

    loadCount();
    return () => { cancelled = true; };
  }, []);

  const authed = !!getToken();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      {authed && (
        <header style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>TRACEOPS</Link>
          <Link to="/" style={{ textDecoration: "none" }}>Events</Link>

          <Link to="/alerts" style={{ textDecoration: "none", display: "flex", gap: 8, alignItems: "center" }}>
            Alerts
            {alertCount > 0 && (
              <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, border: "1px solid #ddd" }}>
                {alertCount}
              </span>
            )}
          </Link>

          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => {
                clearToken();
                nav("/login", { replace: true });
              }}
              style={{ padding: "8px 12px" }}
            >
              Logout
            </button>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<RequireAuth><EventsPage /></RequireAuth>} />
        <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
        <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
      </Routes>
    </div>
  );
}
