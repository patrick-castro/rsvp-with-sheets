const TOKEN_KEY = "admin_session_token"

async function post<T>(path: string, body: unknown): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return { ok: res.ok, data: (await res.json()) as T }
}

export const auth = {
  async login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const { ok, data } = await post<{ token?: string; error?: string }>("/api/login", {
      username,
      password,
    })
    if (!ok || !data.token) {
      return { ok: false, error: data.error ?? "Unable to sign in. Please try again." }
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    return { ok: true }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
  },

  async checkSession(): Promise<boolean> {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return false

    try {
      const { ok, data } = await post<{ authenticated?: boolean }>("/api/session", { token })
      if (ok && data.authenticated) return true
    } catch {
      // fall through to unauthenticated
    }

    localStorage.removeItem(TOKEN_KEY)
    return false
  },
}
