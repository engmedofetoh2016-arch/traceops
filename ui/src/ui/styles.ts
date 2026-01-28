export const ui = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: 20,
    color: "#0f172a",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  } as React.CSSProperties,

  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
    position: "sticky",
    top: 14,
    zIndex: 10,
  } as React.CSSProperties,

  brand: { fontWeight: 900, letterSpacing: -0.4 } as React.CSSProperties,

  link: {
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 600,
    padding: "8px 10px",
    borderRadius: 10,
  } as React.CSSProperties,

  linkActive: {
    background: "#f1f5f9",
    border: "1px solid #e5e7eb",
  } as React.CSSProperties,

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "white",
    boxShadow: "0 1px 0 rgba(15, 23, 42, 0.04)",
  } as React.CSSProperties,

  cardHeader: {
    padding: 14,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  } as React.CSSProperties,

  cardBody: { padding: 14 } as React.CSSProperties,

  h2: { margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: -0.3 } as React.CSSProperties,

  muted: { color: "#64748b" } as React.CSSProperties,

  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    background: "white",
    fontSize: 14,
  } as React.CSSProperties,

  button: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,

  buttonPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  } as React.CSSProperties,

  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  } as React.CSSProperties,

  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
    fontSize: 14,
  } as React.CSSProperties,

  pill: (tone: "gray" | "green" | "amber" | "red") => {
    const map = {
      gray: { bg: "#f1f5f9", bd: "#e2e8f0", fg: "#0f172a" },
      green: { bg: "#dcfce7", bd: "#bbf7d0", fg: "#14532d" },
      amber: { bg: "#fef3c7", bd: "#fde68a", fg: "#92400e" },
      red: { bg: "#fee2e2", bd: "#fecaca", fg: "#7f1d1d" },
    }[tone];

    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      borderRadius: 999,
      background: map.bg,
      border: `1px solid ${map.bd}`,
      color: map.fg,
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap",
    } as React.CSSProperties;
  },

  empty: {
    padding: 20,
    textAlign: "center",
    color: "#64748b",
  } as React.CSSProperties,
};
