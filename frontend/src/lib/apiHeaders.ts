export function getApiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (typeof window !== "undefined") {
    const orgId = localStorage.getItem("nova_active_org_id");
    if (orgId) headers["x-organization-id"] = orgId;
    const token = localStorage.getItem("nova_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const apiFetchInit = (extraHeaders?: Record<string, string>): RequestInit => ({
  credentials: "include",
  headers: getApiHeaders(extraHeaders),
});
