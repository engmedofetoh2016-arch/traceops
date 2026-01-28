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
    return () => {
      cancelled = true;
      clearInterval(t);
    };
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
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--panel)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 14,
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 1000, letterSpacing: -0.6 }}>TRACEOPS</div>

        {authed && (
          <>
            <NavLink to="/" end style={linkStyle}>
              Events
            </NavLink>
            <NavLink to="/alerts" style={linkStyle}>
              Alerts{" "}
              {alertCount > 0 && (
                <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>
                  ({alertCount})
                </span>
              )}
            </NavLink>
          </>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle theme={theme} toggle={toggle} />
          {authed && (
            <button
              onClick={() => {
                clearToken();
                nav("/login", { replace: true });
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      {/* ✅ ROUTES MUST BE HERE */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tenants/new" element={<TenantCreatePage />} />

        <Route path="/" element={<RequireAuth><EventsPage /></RequireAuth>} />
        <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
        <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
        <Route path="/alerts/:id" element={<RequireAuth><AlertDetailPage /></RequireAuth>} />

        <Route path="*" element={<div style={{ padding: 20 }}>Not found</div>} />
      </Routes>
    </div>
  );
}
