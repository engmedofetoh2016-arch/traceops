import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listEvents, type AuditEvent } from "../lib/api";
import { Card, CardHeader, CardBody, Button, Input, Badge, table } from "../ui/components";

function toISO(d: Date) { return d.toISOString(); }

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

  // Quick range (optional). If backend supports from/to, use it.
  const [from, setFrom] = useState<string | undefined>(undefined);

  const query = useMemo(
    () => ({ q, action, actor, from, limit, offset }),
    [q, action, actor, from, limit, offset]
  );

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
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <CardHeader
          title="Events"
          subtitle="Search and review operational audit events."
          right={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge tone="gray">Total: {total}</Badge>
              {loading && <Badge tone="amber">Loading…</Badge>}
            </div>
          }
        />
        <CardBody>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Input value={q} onChange={(e) => { setQ(e.target.value); setOffset(0); }}
              placeholder="Search (q)…" style={{ width: 260 }} />
            <Input value={action} onChange={(e) => { setAction(e.target.value); setOffset(0); }}
              placeholder="Action (exact)…" style={{ width: 220 }} />
            <Input value={actor} onChange={(e) => { setActor(e.target.value); setOffset(0); }}
              placeholder="Actor (exact)…" style={{ width: 260 }} />

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Button onClick={() => { setFrom(toISO(new Date(Date.now() - 24 * 3600 * 1000))); setOffset(0); }}>
                Last 24h
              </Button>
              <Button onClick={() => { setFrom(toISO(new Date(Date.now() - 7 * 24 * 3600 * 1000))); setOffset(0); }}>
                Last 7d
              </Button>
              <Button onClick={() => { setFrom(undefined); setOffset(0); }}>
                All time
              </Button>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Button
                onClick={() => { setQ(""); setAction(""); setActor(""); setFrom(undefined); setOffset(0); }}
              >
                Clear
              </Button>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12 }}>
              <Badge tone="red">{error}</Badge>
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
                <th style={table.th}>Actor</th>
                <th style={table.th}>Action</th>
                <th style={table.th}>Resource</th>
                <th style={table.th}>Result</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => {
                const resultTone =
                  e.result === "SUCCESS" ? "green" :
                  e.result ? "amber" : "gray";

                return (
                  <tr key={e.id} style={table.trHover}
                    onMouseEnter={(ev) => ((ev.currentTarget.style.background = "rgba(148,163,184,0.08)"))}
                    onMouseLeave={(ev) => ((ev.currentTarget.style.background = "transparent"))}
                  >
                    <td style={table.td}>
                      <Link to={`/events/${e.id}`} style={{ fontWeight: 900, textDecoration: "none" }}>
                        {new Date(e.occurredAt).toLocaleString()}
                      </Link>
                    </td>
                    <td style={table.td}>
                      <span style={{ fontWeight: 700 }}>{e.actor}</span>
                    </td>
                    <td style={table.td}>
                      <Badge tone="gray">{e.action}</Badge>
                    </td>
                    <td style={table.td}>
                      {e.resource}{e.resourceId ? `:${e.resourceId}` : ""}
                    </td>
                    <td style={table.td}>
                      {e.result ? <Badge tone={resultTone as any}>{e.result}</Badge> : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                  </tr>
                );
              })}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: "var(--muted)", textAlign: "center" }}>
                    No events found for your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 14,
          borderTop: "1px solid var(--border)"
        }}>
          <Button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
            Prev
          </Button>
          <div style={{ color: "var(--muted)", fontWeight: 800 }}>
            Page {page} / {pages}
          </div>
          <Button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
