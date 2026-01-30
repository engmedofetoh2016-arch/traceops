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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAlert(id);
      setItem(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Button onClick={() => nav(-1)}>← Back</Button>
        <div style={{ fontWeight: 1000, letterSpacing: -0.4 }}>Alert Details</div>
      </div>

      {loading && <Badge tone="amber">Loading…</Badge>}
      {error && <Badge tone="red">{error}</Badge>}

      {item && (
        <Card>
          <CardHeader
            title={item.title}
            subtitle={`${new Date(item.createdAt).toLocaleString()} • ${item.type}`}
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge tone={severityTone(item.severity) as any}>{item.severity}</Badge>
                <Badge tone={item.isResolved ? "green" : "amber"}>
                  {item.isResolved ? "RESOLVED" : "OPEN"}
                </Badge>
              </div>
            }
          />

          <CardBody>
            {item.details && (
              <div
                style={{
                  border: "1px solid var(--border)",
                  background: "rgba(148,163,184,0.08)",
                  padding: 14,
                  borderRadius: 14,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.details}
              </div>
            )}

            <div style={{ height: 14 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {item.eventId && (
                <Link
                  to={`/events/${item.eventId}`}
                  style={{
                    textDecoration: "none",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontWeight: 950,
                  }}
                >
                  View related event →
                </Link>
              )}

              {!item.isResolved && (
                <Button
                  variant="primary"
                  disabled={resolving}
                  onClick={async () => {
                    if (!id) return;
                    setResolving(true);
                    try {
                      await resolveAlert(id);
                      await load();
                    } catch (e: any) {
                      setError(e?.message ?? "Resolve failed");
                    } finally {
                      setResolving(false);
                    }
                  }}
                >
                  {resolving ? "Resolving…" : "Resolve"}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
