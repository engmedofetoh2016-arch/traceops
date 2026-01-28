import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setToken } from "../lib/api";
import { Card, CardBody, Button, Input, Badge } from "../ui/components";
import { useTheme } from "../ui/useTheme";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Link } from "react-router-dom";


export default function LoginPage() {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ minHeight: "calc(100vh - 40px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 1000, letterSpacing: -0.6, fontSize: 16 }}>TRACEOPS</div>
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>

        <Card>
          <CardBody>
            <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.6 }}>Sign in</div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              Audit-ready visibility for internal systems.
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 10 }}>
              <Input placeholder="TenantId (GUID)" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div style={{ height: 12 }} />

            <Button
              variant="primary"
              disabled={loading}
              onClick={async () => {
                setErr(null);
                setLoading(true);
                try {
                  const res = await login({ tenantId, email, password });
                  setToken(res.token);
                  nav("/", { replace: true });
                } catch (e: any) {
                  setErr(e?.message ?? "Login failed");
                } finally {
                  setLoading(false);
                }
              }}
              style={{ width: "100%" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}> Need a user?{" "} <Link to="/register" style={{ fontWeight: 900, textDecoration: "none" }}>
             Create one </Link></div>
             <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
  Demo setup:{" "}
  <Link to="/tenants/new" style={{ fontWeight: 900, textDecoration: "none" }}>
    Create tenant
  </Link>
  {" • "}
  <Link to="/register" style={{ fontWeight: 900, textDecoration: "none" }}>
    Create user
  </Link>
</div>

            {err && (
              <div style={{ marginTop: 12 }}>
                <Badge tone="red">{err}</Badge>
              </div>
            )}

            <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>
              Tip: use the same tenantId you got from <code>/dev/seed</code>.
            </div>
          </CardBody>
        </Card>

        <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 12, textAlign: "center" }}>
          © {new Date().getFullYear()} TRACEOPS
        </div>
      </div>
    </div>
  );
}
