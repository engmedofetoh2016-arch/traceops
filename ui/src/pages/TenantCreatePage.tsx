import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { devCreateTenant, devListTenants } from "../lib/api";
import { Card, CardBody, Button, Input, Badge, table } from "../ui/components";
import { useTheme } from "../ui/useTheme";
import { ThemeToggle } from "../ui/ThemeToggle";

export default function TenantCreatePage() {
  const { theme, toggle } = useTheme();

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const [tenants, setTenants] = useState<{ id: string; name: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function loadTenants() {
    setLoading(true);
    setErr(null);
    try {
      const res = await devListTenants();
      setTenants(res.items);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  return (
    <div style={{ minHeight: "calc(100vh - 40px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 760 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 1000, letterSpacing: -0.6, fontSize: 16 }}>TRACEOPS</div>
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>

        <Card>
          <CardBody>
            <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.6 }}>Create tenant</div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              Bootstrap tenant creation (DEV only / ALLOW_BOOTSTRAP=true).
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Input
                placeholder="Tenant name (e.g. Demo School, NGO, SaaS Co...)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: 420 }}
              />

              <Button
                variant="primary"
                disabled={creating}
                onClick={async () => {
                  setErr(null);
                  setOk(null);
                  setCreating(true);
                  try {
                    const res = await devCreateTenant({ name });
                    setOk(`Tenant created: ${res.name} (${res.id})`);
                    setName("");
                    await loadTenants();
                  } catch (e: any) {
                    setErr(e?.message ?? "Create tenant failed");
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                {creating ? "Creating…" : "Create tenant"}
              </Button>

              <Button disabled={loading} onClick={loadTenants}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>

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
              Next:{" "}
              <Link to="/register" style={{ fontWeight: 900, textDecoration: "none" }}>
                Create user →
              </Link>
              {"  "}or{" "}
              <Link to="/login" style={{ fontWeight: 900, textDecoration: "none" }}>
                Login →
              </Link>
            </div>
          </CardBody>
        </Card>

        <div style={{ height: 14 }} />

        <Card>
          <CardBody>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 950 }}>Recent tenants</div>
              <Badge tone="gray">{tenants.length}</Badge>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={table.table}>
                <thead>
                  <tr>
                    <th style={table.th}>Created</th>
                    <th style={table.th}>Name</th>
                    <th style={table.th}>TenantId</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <td style={table.td}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td style={table.td} style={{ ...table.td, fontWeight: 900 }}>{t.name}</td>
                      <td style={table.td}>
                        <code style={{ color: "var(--muted)" }}>{t.id}</code>
                      </td>
                    </tr>
                  ))}

                  {!loading && tenants.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: 18, color: "var(--muted)", textAlign: "center" }}>
                        No tenants yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
