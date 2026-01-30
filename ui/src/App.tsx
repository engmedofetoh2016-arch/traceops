import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TenantCreatePage from "./pages/TenantCreatePage";

import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import AlertsPage from "./pages/AlertsPage";
import AlertDetailPage from "./pages/AlertDetailPage";
import ReportsPage from "./pages/ReportsPage"; // ✅ IMPORTANT

import { clearToken, getToken, listAlerts } from "./lib/api";
import { ThemeToggle } from "./ui/ThemeToggle";
import { useTheme } from "./ui/useTheme";

function RequireAuth({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [alertCount, setAlertCount] = useState<number>(0);
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      if (!getToken()) return;
      try {
        const res = await listAlerts({ resolved: false, limit: 1, offset: 0 });
        if (!cancelled) setAlertCount(res.paging.total);
      } catch {
        if (!cancelled) setAlertCount(0);
      }
    }

    loadCount();
    const t = setInterval(loadCount, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const authed = !!getToken();

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    textDecoration: "none",
    color: "var(--text)",
    fontWeight: 900,
    padding: "8px 10px",
    borderRadius: 12,
    border: isActive ? "1px solid var(--border)" : "1px solid transparent",
    background: isActive ? "rgba(148,163,184,0.10)" : "transparent",
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
      {/* header ... your current header here */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 1000 }}>TRACEOPS</div>

        {authed && (
          <>
            <NavLink to="/" end style={linkStyle}>Events</NavLink>
            <NavLink to="/alerts" style={linkStyle}>Alerts ({alertCount})</NavLink>
            <NavLink to="/reports" style={linkStyle}>Reports</NavLink> {/* ✅ */}
          </>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle theme={theme} toggle={toggle} />
          {authed && (
            <button onClick={() => { clearToken(); nav("/login", { replace: true }); }}>
              Logout
            </button>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <Routes>
        {/* public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tenants/new" element={<TenantCreatePage />} />

        {/* protected */}
        <Route path="/" element={<RequireAuth><EventsPage /></RequireAuth>} />
        <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
        <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
        <Route path="/alerts/:id" element={<RequireAuth><AlertDetailPage /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} /> {/* ✅ */}

        {/* fallback */}
        <Route path="*" element={<div style={{ padding: 20 }}>Not found</div>} />
      </Routes>
    </div>
  );
}
