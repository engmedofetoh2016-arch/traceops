import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../lib/api";
import { Card, CardBody, Button, Input, Badge } from "../ui/components";
import { useTheme } from "../ui/useTheme";
import { ThemeToggle } from "../ui/ThemeToggle";

export default function RegisterPage() {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "calc(100vh - 40px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 1000, letterSpacing: -0.6, fontSize: 16 }}>TRACEOPS</div>
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>

        <Card>
          <CardBody>
            <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.6 }}>Create user</div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              Bootstrap user creation (DEV only / ALLOW_BOOTSTRAP=true).
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 10 }}>
              <Input
                placeholder="TenantId (GUID)"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />

              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                placeholder="Role (ADMIN / AUDITOR / VIEWER)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <div style={{ height: 12 }} />

            <Button
              variant="primary"
              disabled={loading}
              onClick={async () => {
                setErr(null);
                setOk(null);
                setLoading(true);
                try {
                  await register({ tenantId, email, password, role });
                  setOk("User created successfully. You can now login.");
                } catch (e: any) {
                  setErr(e?.message ?? "Register failed");
                } finally {
                  setLoading(false);
                }
              }}
              style={{ width: "100%" }}
            >
              {loading ? "Creating…" : "Create user"}
            </Button>

            {err && (
              <div style={{ marginTop: 12 }}>
                <Badge tone="red">{err}</Badge>
              </div>
            )}

            {ok && (
              <div style={{ marginTop: 12 }}>
                <Badge tone="green">{ok}</Badge>
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              <Link to="/login" style={{ fontWeight: 900, textDecoration: "none" }}>
                ← Back to Login
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
