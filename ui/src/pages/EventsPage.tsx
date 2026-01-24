import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listEvents, type AuditEvent } from "../lib/api";

export default function EventsPage() {
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");

  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => ({ q, action, actor, limit, offset }), [q, action, actor, limit, offset]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await listEvents(query);
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.paging.total);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed");
        setItems([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [query]);

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOffset(0); }}
            placeholder="Search (q)…"
            style={{ padding: 8, width: 260 }}
          />
          <input
            value={action}
            onChange={(e) => { setAction(e.target.value); setOffset(0); }}
            placeholder="Action (exact)…"
            style={{ padding: 8, width: 220 }}
          />
          <input
            value={actor}
            onChange={(e) => { setActor(e.target.value); setOffset(0); }}
            placeholder="Actor (exact)…"
            style={{ padding: 8, width: 260 }}
          />
          <button onClick={() => { setQ(""); setAction(""); setActor(""); setOffset(0); }} style={{ padding: "8px 12px" }}>
            Clear
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 10, color: "crimson", whiteSpace: "pre-wrap" }}>
            {error}
          </div>
        )}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>
            Events {loading ? "(loading…)" : ""}
          </div>
          <div style={{ opacity: 0.7 }}>Total: {total}</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7f7f7" }}>
              <th style={th}>Time</th>
              <th style={th}>Actor</th>
              <th style={th}>Action</th>
              <th style={th}>Resource</th>
              <th style={th}>Result</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td style={td}>
                  <Link to={`/events/${e.id}`}>{new Date(e.occurredAt).toLocaleString()}</Link>
                </td>
                <td style={td}>{e.actor}</td>
                <td style={td}>{e.action}</td>
                <td style={td}>{e.resource}{e.resourceId ? `:${e.resourceId}` : ""}</td>
                <td style={td}>{e.result ?? ""}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td style={td} colSpan={5}>No events found.</td></tr>
            )}
          </tbody>
        </table>

        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} style={{ padding: "8px 12px" }}>
            Prev
          </button>
          <div>Page {page} / {pages}</div>
          <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} style={{ padding: "8px 12px" }}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: 10, borderBottom: "1px solid #eee", verticalAlign: "top" };
