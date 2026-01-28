import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAlerts, type AlertItem } from "../lib/api";
import { Card, CardHeader, CardBody, Badge, table } from "../ui/components";

function severityTone(sev: string) {
  const s = (sev ?? "").toUpperCase();
  if (s === "HIGH") return "red";
  if (s === "MEDIUM") return "amber";
  if (s === "LOW") return "green";
  return "gray";
}

export default function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await listAlerts({ resolved: false, limit: 50, offset: 0 });
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.paging.total);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <CardHeader
          title="Alerts"
          subtitle="Unresolved alerts generated from audit rules."
          right={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge tone="gray">Unresolved: {total}</Badge>
              {loading && <Badge tone="amber">Loading…</Badge>}
            </div>
          }
        />
        <CardBody>
          {error && <Badge tone="red">{error}</Badge>}
          {!error && (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Click an alert to view details and resolve it.
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={table.table}>
            <thead>
              <tr>
                <th style={table.th}>Time</th>
                <th style={table.th}>Title</th>
                <th style={table.th}>Severity</th>
                <th style={table.th}>Type</th>
                <th style={table.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}
                    style={table.trHover}
                    onMouseEnter={(ev) => ((ev.currentTarget.style.background = "rgba(148,163,184,0.08)"))}
                    onMouseLeave={(ev) => ((ev.currentTarget.style.background = "transparent"))}
                >
                  <td style={table.td}>{new Date(a.createdAt).toLocaleString()}</td>
                  <td style={table.td}>
                    <Link to={`/alerts/${a.id}`} style={{ textDecoration: "none", fontWeight: 950 }}>
                      {a.title}
                    </Link>
                    {a.details && (
                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                        {a.details}
                      </div>
                    )}
                  </td>
                  <td style={table.td}><Badge tone={severityTone(a.severity) as any}>{a.severity}</Badge></td>
                  <td style={table.td}><Badge tone="gray">{a.type}</Badge></td>
                  <td style={table.td}><Badge tone="amber">OPEN</Badge></td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: "var(--muted)", textAlign: "center" }}>
                    No unresolved alerts 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
