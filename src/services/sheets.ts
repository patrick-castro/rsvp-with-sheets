const BASE = import.meta.env.VITE_APPS_SCRIPT_URL as string

async function get(params: Record<string, string>) {
  const url = new URL(BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  return res.json()
}

export type Guest = {
  id: string
  name: string
  status: "pending" | "confirmed" | "declined"
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type SearchResult =
  | { found: false }
  | { found: true; guests: Guest[] }

export const sheets = {
  search: (name: string): Promise<SearchResult> =>
    get({ action: "search", name }),

  rsvp: (id: string, status: string, note: string) =>
    get({ action: "rsvp", id, status, note }),

  list: (): Promise<Guest[]> =>
    get({ action: "list" }),

  addGuest: (name: string) =>
    get({ action: "addGuest", name }),

  updateStatus: (id: string, status: string, note: string) =>
    get({ action: "updateStatus", id, status, note }),

  updateName: (id: string, name: string) =>
    get({ action: "updateName", id, name }),

  deleteGuest: (id: string) =>
    get({ action: "deleteGuest", id }),
}
