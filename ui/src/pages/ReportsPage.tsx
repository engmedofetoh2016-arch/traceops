import { useEffect, useMemo, useState } from "react";
import {
  createAuditPack,
  downloadReportRun,
  listReportRuns,
  type ReportRunItem,
} from "../lib/api";
import { downloadEventsCsv } from "../lib/api";
import { Card, CardHeader, CardBody, Button, Badge, table } from "../ui/components";

function iso(d: Date) { return d.toISOString(); }

export default function ReportsPage() {
  const [err, setErr] = useState<string | null>(null);

  const [busyCsv, setBusyCsv] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);

  const [from, setFrom] = useState<Date>(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [to, setTo] = useState<Date>(() => new Date());

  const fromIso = useMemo(() => iso(from), [from]);
  const toIso = useMemo(() => iso(to), [to]);

  const [runs, setRuns] = useState<ReportRunItem[]>([]);
  const [runsTotal, setRunsTotal] = useState(0);
  const [loadingRuns, setLoadingRuns] = useState(false);

  async function refreshRuns() {
    setLoadingRuns(true);
    try {
      const res = await listReportRuns({ limit: 20, offset: 0 });
      setRuns(res.items);
      setRunsTotal(res.paging.total);
    } finally {
      setLoadingRuns(false);
    }
  }

  useEffect(() => {
    refreshRuns();
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Range + Exports */}
      <Card>
        <CardHeader
          title="Audit Mode"
          subtitle="Pick a range, export CSV, or generate an Audit Pack PDF."
          right={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge tone="gray">Reports</Badge>
              {(busyCsv || busyPdf) && <Badge tone="amber">Working…</Badge>}
            </div>
          }
        />
        <CardBody>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Button onClick={() => { setFrom(new Date(Date.now() - 24 * 60 * 60 * 1000)); setTo(new Date()); }}>
              Last 24h
            </Button>
            <Button onClick={() => { setFrom(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); setTo(new Date()); }}>
              Last 7d
            </Button>
            <Button onClick={() => { setFrom(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); setTo(new Date()); }}>
              Last 30d
            </Button>
          </div>

          <div style={{ height: 14 }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 740 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>From</div>
              <input type="datetime-local" value={toLocalInput(from)} onChange={(e) => setFrom(new Date(e.target.value))} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>To</div>
              <input type="datetime-local" value={toLocalInput(to)} onChange={(e) => setTo(new Date(e.target.value))} style={inp} />
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* CSV */}
            <Button
              disabled={busyCsv}
              onClick={async () => {
                setErr(null);
                setBusyCsv(true);
                try {
                  await downloadEventsCsv({ from: fromIso, to: toIso });
                } catch (e: any) {
                  setErr(e?.message ?? "CSV export failed");
                } finally {
                  setBusyCsv(false);
                }
              }}
            >
              {busyCsv ? "Preparing…" : "Download CSV"}
            </Button>

            {/* PDF */}
            <Button
              variant="primary"
              disabled={busyPdf}
              onClick={async () => {
                setErr(null);
                setBusyPdf(true);
                try {
                 console.log("CLICK PDF", { fromIso, toIso });
                 const res = await createAuditPack({ from: fromIso, to: toIso });
                 console.log("PDF RES", res);
                  await refreshRuns();
                  await downloadReportRun(res.id);
                } catch (e: any) {
                  setErr(e?.message ?? "PDF generation failed");
                } finally {
                  setBusyPdf(false);
                }
              }}
            >
              {busyPdf ? "Generating…" : "Generate Audit Pack PDF"}
            </Button>

            <Badge tone="gray">
              Range: {from.toLocaleString()} → {to.toLocaleString()}
            </Badge>
          </div>

          {err && (
            <div style={{ marginTop: 12 }}>
              <Badge tone="red">{err}</Badge>
            </div>
          )}
        </CardBody>
      </Card>

      {/* History */}
      <Card>
        <CardHeader
          title="Recent report runs"
          subtitle="Stored audit packs for this tenant."
          right={<Badge tone="gray">Total: {runsTotal}</Badge>}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={table.table}>
            <thead>
              <tr>
                <th style={table.th}>Created</th>
                <th style={table.th}>Type</th>
                <th style={table.th}>Range</th>
                <th style={table.th}>File</th>
                <th style={table.th}></th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id}
                    style={table.trHover}
                    onMouseEnter={(ev) => ((ev.currentTarget.style.background = "rgba(148,163,184,0.08)"))}
                    onMouseLeave={(ev) => ((ev.currentTarget.style.background = "transparent"))}
                >
                  <td style={table.td}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td style={table.td}><Badge tone="gray">{r.type}</Badge></td>
                  <td style={table.td}>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {new Date(r.from).toLocaleString()} → {new Date(r.to).toLocaleString()}
                    </div>
                  </td>
                  <td style={table.td}>
                    <code style={{ color: "var(--muted)" }}>{r.fileName}</code>
                  </td>
                  <td style={table.td}>
                    <Button onClick={() => downloadReportRun(r.id)}>Download</Button>
                  </td>
                </tr>
              ))}

              {!loadingRuns && runs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: "var(--muted)", textAlign: "center" }}>
                    No report runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {loadingRuns && (
          <div style={{ padding: 14 }}>
            <Badge tone="amber">Loading…</Badge>
          </div>
        )}
      </Card>
    </div>
  );
}

const inp = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(148,163,184,0.06)",
  color: "var(--text)",
  outline: "none",
} as const;

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
