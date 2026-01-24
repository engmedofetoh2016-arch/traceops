import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvent, type AuditEvent } from "../lib/api";

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
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">← Back</Link>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</div>}

      {item && (
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Event</div>

          <Row label="Time" value={new Date(item.occurredAt).toLocaleString()} />
          <Row label="Actor" value={item.actor} />
          <Row label="Action" value={item.action} />
          <Row label="Resource" value={`${item.resource}${item.resourceId ? ":" + item.resourceId : ""}`} />
          <Row label="IP" value={item.ip ?? ""} />
          <Row label="Result" value={item.result ?? ""} />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Metadata</div>
            <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8, overflowX: "auto" }}>
              {JSON.stringify(item.metadata ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #eee" }}>
      <div style={{ width: 90, opacity: 0.7 }}>{label}</div>
      <div style={{ flex: 1 }}>{value}</div>
    </div>
  );
}
