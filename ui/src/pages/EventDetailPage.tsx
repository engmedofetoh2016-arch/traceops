import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvent, type AuditEvent } from "../lib/api";
import { Card, CardHeader, CardBody, Badge } from "../ui/components";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<AuditEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getEvent(id);
        if (!cancelled) setItem(res);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <Link to="/" style={{ textDecoration: "none", color: "var(--muted)", fontWeight: 900 }}>← Back</Link>
      </div>

      <Card>
        <CardHeader
          title="Event details"
          subtitle={item ? `${item.action} • ${item.resource}${item.resourceId ? ":" + item.resourceId : ""}` : "Loading event"}
          right={
            loading ? <Badge tone="amber">Loading…</Badge> :
            error ? <Badge tone="red">Error</Badge> :
            item?.result ? <Badge tone={item.result === "SUCCESS" ? "green" : "amber"}>{item.result}</Badge> :
            <Badge tone="gray">—</Badge>
          }
        />
        <CardBody>
          {error && <Badge tone="red">{error}</Badge>}

          {item && (
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
              <Label>Time</Label><Value>{new Date(item.occurredAt).toLocaleString()}</Value>
              <Label>Actor</Label><Value>{item.actor}</Value>
              <Label>Action</Label><Value><Badge tone="gray">{item.action}</Badge></Value>
              <Label>Resource</Label><Value>{item.resource}{item.resourceId ? `:${item.resourceId}` : ""}</Value>
              <Label>IP</Label><Value>{item.ip ?? <span style={{ color: "var(--muted)" }}>—</span>}</Value>

              <div style={{ gridColumn: "1 / -1", marginTop: 10 }}>
                <div style={{ fontWeight: 950, marginBottom: 8 }}>Metadata</div>
                <pre style={{
                  margin: 0,
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "rgba(148,163,184,0.08)",
                  overflowX: "auto",
                  color: "var(--text)"
                }}>
                  {JSON.stringify(item.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "var(--muted)", fontWeight: 900 }}>{children}</div>;
}
function Value({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 750 }}>{children}</div>;
}
