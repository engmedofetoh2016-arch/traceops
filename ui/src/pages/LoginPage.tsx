import { useState } from "react";
import { login, setToken } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();
  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>TRACEOPS Login</h2>

      <input style={inp} placeholder="TenantId (GUID)"
        value={tenantId} onChange={(e) => setTenantId(e.target.value)} />

      <input style={inp} placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />

      <input style={inp} placeholder="Password" type="password"
        value={password} onChange={(e) => setPassword(e.target.value)} />

      <button
        disabled={loading}
        style={{ padding: "10px 14px" }}
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
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {err && <div style={{ marginTop: 10, color: "crimson", whiteSpace: "pre-wrap" }}>{err}</div>}

      <div style={{ marginTop: 12, opacity: 0.7 }}>
        Tip: Use the same tenantId you got from <code>/dev/seed</code>.
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { display: "block", width: "100%", padding: 10, marginBottom: 10 };
