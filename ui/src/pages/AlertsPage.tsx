import { useEffect, useState } from "react";
import { listAlerts, type AlertItem } from "../lib/api";

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
    <div>
      <h2 style={{ marginTop: 0 }}>Alerts</h2>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</div>}

      <div style={{ opacity: 0.7, marginBottom: 10 }}>
        Unresolved: {total}
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7f7f7" }}>
              <th style={th}>Time</th>
              <th style={th}>Severity</th>
              <th style={th}>Type</th>
              <th style={th}>Title</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id}>
                <td style={td}>{new Date(a.createdAt).toLocaleString()}</td>
                <td style={td}>{a.severity}</td>
                <td style={td}>{a.type}</td>
                <td style={td}>{a.title}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td style={td} colSpan={4}>No unresolved alerts.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: 10, borderBottom: "1px solid #eee" };
