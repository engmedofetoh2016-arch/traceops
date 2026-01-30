// src/lib/api.ts

export type AuditEvent = {
  id: string;
  occurredAt: string;
  actor: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  ip?: string | null;
  result?: string | null;
  metadata?: any;
};

export type EventsResponse = {
  paging: { limit: number; offset: number; total: number; hasMore: boolean };
  items: AuditEvent[];
};

export type AlertItem = {
  id: string;
  createdAt: string;
  type: string;
  severity: string;
  title: string;
  details?: string | null;
  eventId?: string | null;   // ✅ add
  isResolved: boolean;
};


export type AlertsResponse = {
  paging: { limit: number; offset: number; total: number };
  items: AlertItem[];
};

const TOKEN_KEY = "TRACEOPS_TOKEN";

// base URL from env (can be empty for same-origin)
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init?.headers as any),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...init, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export function login(payload: { tenantId: string; email: string; password: string }) {
  return request<{ token: string; user: any }>(`/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function listEvents(params: {
  from?: string;
  to?: string;
  actor?: string;
  action?: string;
  resource?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.actor) sp.set("actor", params.actor);
  if (params.action) sp.set("action", params.action);
  if (params.resource) sp.set("resource", params.resource);
  if (params.q) sp.set("q", params.q);
  sp.set("limit", String(params.limit ?? 50));
  sp.set("offset", String(params.offset ?? 0));

  return request<EventsResponse>(`/v1/events?${sp.toString()}`);
}

export function getEvent(id: string) {
  return request<AuditEvent>(`/v1/events/${encodeURIComponent(id)}`);
}

export function listAlerts(params: { resolved?: boolean; limit?: number; offset?: number }) {
  const sp = new URLSearchParams();
  if (params.resolved !== undefined) sp.set("resolved", String(params.resolved));
  sp.set("limit", String(params.limit ?? 50));
  sp.set("offset", String(params.offset ?? 0));
  return request<AlertsResponse>(`/v1/alerts?${sp.toString()}`);
}

export function register(payload: {
  tenantId: string;
  email: string;
  password: string;
  role: string;
}) {
  return request<{ id: string }>(`/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export function devCreateTenant(payload: { name: string }) {
  return request<{ id: string; name: string }>(`/dev/tenants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function devListTenants() {
  return request<{ items: { id: string; name: string; createdAt: string }[] }>(`/dev/tenants`);
}
export function getAlert(id: string) {
  return request<AlertItem>(`/v1/alerts/${encodeURIComponent(id)}`);
}

export function resolveAlert(id: string) {
  return request<{ id: string; isResolved: boolean; resolvedAt?: string }>(
    `/v1/alerts/${encodeURIComponent(id)}/resolve`,
    { method: "PATCH" }
  );
}
export async function downloadEventsCsv(params: {
  from?: string;
  to?: string;
  actor?: string;
  action?: string;
  resource?: string;
  q?: string;
}) {
  const sp = new URLSearchParams();
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.actor) sp.set("actor", params.actor);
  if (params.action) sp.set("action", params.action);
  if (params.resource) sp.set("resource", params.resource);
  if (params.q) sp.set("q", params.q);

  const token = getToken();
  const res = await fetch(`${API_BASE}/v1/reports/events.csv?${sp.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `traceops-events.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
export type ReportsSummary = {
  from: string;
  to: string;
  totals: { events: number; success: number; failed: number; exports: number };
  topActions: { key: string; count: number }[];
  topActors: { key: string; count: number }[];
};

export function getReportsSummary(params: { from: string; to: string }) {
  const sp = new URLSearchParams();
  sp.set("from", params.from);
  sp.set("to", params.to);
  return request<ReportsSummary>(`/v1/reports/summary?${sp.toString()}`);
}

export type ReportRunItem = {
  id: string;
  type: string;
  from: string;
  to: string;
  createdAt: string;
  fileName: string;
};

export type ReportRunsResponse = {
  paging: { limit: number; offset: number; total: number };
  items: ReportRunItem[];
};

export function createAuditPack(payload: { from: string; to: string }) {
  return request<{ id: string; createdAt: string; fileName: string }>(`/v1/reports/audit-pack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: payload.from, to: payload.to }),
  });
}

export function listReportRuns(params: { limit?: number; offset?: number }) {
  const sp = new URLSearchParams();
  sp.set("limit", String(params.limit ?? 20));
  sp.set("offset", String(params.offset ?? 0));
  return request<ReportRunsResponse>(`/v1/reports/runs?${sp.toString()}`);
}

export async function downloadReportRun(id: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/v1/reports/runs/${encodeURIComponent(id)}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const cd = res.headers.get("content-disposition");
  const match = cd?.match(/filename="(.+)"/);
  a.download = match?.[1] ?? "traceops-audit-pack.pdf";

  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}





