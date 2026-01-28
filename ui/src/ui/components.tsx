import React from "react";

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 18,
      background: "var(--card)",
      boxShadow: "var(--shadow)",
      overflow: "hidden",
      ...style
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }:
  { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{
      padding: 16,
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 950, letterSpacing: -0.3 }}>{title}</div>
        {subtitle && <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted)" }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 16 }}>{children}</div>;
}

export function Button(
  { children, onClick, disabled, variant = "ghost", style, type }: 
  { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "ghost" | "primary" | "danger"; style?: React.CSSProperties; type?: "button" | "submit" }
) {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
  };

  const primary: React.CSSProperties = {
    border: "1px solid var(--primary)",
    background: "var(--primary)",
    color: "var(--primaryText)",
  };

  const danger: React.CSSProperties = {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.10)",
    color: "var(--text)",
  };

  return (
    <button type={type ?? "button"} disabled={disabled} onClick={onClick}
      style={{ ...base, ...(variant === "primary" ? primary : {}), ...(variant === "danger" ? danger : {}), ...style }}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: props.style?.width ?? undefined,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--text)",
        outline: "none",
        fontSize: 14,
        ...(props.style ?? {})
      }}
    />
  );
}

export function Badge({ tone, children }: { tone: "gray" | "green" | "amber" | "red"; children: React.ReactNode }) {
  const map = {
    gray: ["var(--pillGrayBg)", "var(--pillGrayBd)", "var(--pillGrayFg)"],
    green: ["var(--pillGreenBg)", "var(--pillGreenBd)", "var(--pillGreenFg)"],
    amber: ["var(--pillAmberBg)", "var(--pillAmberBd)", "var(--pillAmberFg)"],
    red: ["var(--pillRedBg)", "var(--pillRedBd)", "var(--pillRedFg)"],
  } as const;

  const [bg, bd, fg] = map[tone];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      background: bg,
      border: `1px solid ${bd}`,
      color: fg,
      fontSize: 12,
      fontWeight: 950,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export const table = {
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 } as React.CSSProperties,
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 950,
    padding: "10px 12px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(148,163,184,0.08)",
  } as React.CSSProperties,
  td: {
    padding: "12px",
    borderBottom: "1px solid var(--borderSoft)",
    verticalAlign: "top",
    fontSize: 14,
  } as React.CSSProperties,
  trHover: {
    transition: "background 120ms ease",
  } as React.CSSProperties,
};
