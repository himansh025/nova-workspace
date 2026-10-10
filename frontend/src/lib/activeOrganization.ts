const ORG_ID_KEY = "nova_active_org_id";
const ORG_NAME_KEY = "nova_active_org_name";

export interface ActiveOrganization {
  id: string;
  name: string;
}

type Listener = (org: ActiveOrganization) => void;

let memory: ActiveOrganization | null = null;
const listeners = new Set<Listener>();

function readFromStorage(): ActiveOrganization | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(ORG_ID_KEY);
  const name = localStorage.getItem(ORG_NAME_KEY);
  if (id && name) return { id, name };
  if (id) return { id, name: "" };
  return null;
}

export function getActiveOrganizationId(): string | null {
  if (memory?.id) return memory.id;
  return readFromStorage()?.id ?? null;
}

/** Synchronous label for header — avoids flicker before network. */
export function getActiveOrganizationName(): string {
  if (memory?.name) return memory.name;
  const stored = readFromStorage();
  if (stored?.name) {
    memory = stored;
    return stored.name;
  }
  return "";
}

export function setActiveOrganization(org: ActiveOrganization): void {
  memory = org;
  if (typeof window !== "undefined") {
    localStorage.setItem(ORG_ID_KEY, org.id);
    localStorage.setItem(ORG_NAME_KEY, org.name);
  }
  listeners.forEach((fn) => fn(org));
}

export function clearActiveOrganization(): void {
  memory = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(ORG_ID_KEY);
    localStorage.removeItem(ORG_NAME_KEY);
  }
}

export function subscribeActiveOrganization(listener: Listener): () => void {
  listeners.add(listener);
  const current = memory ?? readFromStorage();
  if (current?.name) {
    memory = current;
    listener(current);
  }
  return () => listeners.delete(listener);
}
