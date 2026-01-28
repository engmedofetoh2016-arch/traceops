import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAlert, resolveAlert, type AlertItem } from "../lib/api";
import { Card, CardHeader, CardBody, Badge, Button } from "../ui/components";

function severityTone(sev: string) {
  const s = (sev ?? "").toUpperCase();
  if (s === "HIGH") return "red";
  if (s === "MEDIUM") return "amber";
  if (s === "LOW") return "green";
  return "gray";
}

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [item, setItem] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const a = await getAlert(id);
      setItem(a);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link to="/alerts" style={{ textDecoration: "none", color: "var(--muted)", fontWeight: 900 }}>← Back</Link>
        {loading && <Badge tone="amber">Loading…</Badge>}
        {err && <Badge tone="red">{err}</Badge>}
      </div>

      <Card>
        <CardHeader
          title={item?.title ?? "Alert"}
          subtitle={item ? `${item.type} • Created ${new Date(item.createdAt).toLocaleString()}` : "—"}
          right={
            item ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge tone={severityTone(item.severity) as any}>{item.severity}</Badge>
                <Badge tone={item.isResolved ? "green" : "amber"}>{item.isResolved ? "RESOLVED" : "OPEN"}</Badge>
              </div>
            ) : <Badge tone="gray">—</Badge>
          }
        />
        <CardBody>
          {item && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
                <Label>Details</Label>
                <Value>{item.details ?? <span style={{ color: "var(--muted)" }}>—</span>}</Value>

                <Label>Related event</Label>
                <Value>
                  {item.eventId ? (
                    <Button onClick={() => nav(`/events/${item.eventId}`)}>View event</Button>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>—</span>
                  )}
                </Value>
              </div>

              <div style={{ height: 14 }} />

              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  variant="primary"
                  disabled={item.isResolved || resolving}
                  onClick={async () => {
                    if (!id) return;
                    setResolving(true);
                    setErr(null);
                    try {
                      await resolveAlert(id);
                      await load();
                    } catch (e: any) {
                      setErr(e?.message ?? "Resolve failed");
                    } finally {
                      setResolving(false);
                    }
                  }}
                >
                  {item.isResolved ? "Resolved" : (resolving ? "Resolving…" : "Resolve")}
                </Button>

                <Button onClick={load} disabled={loading || resolving}>
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "var(--muted)", fontWeight: 950 }}>{children}</div>;
}
function Value({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 750 }}>{children}</div>;
}
