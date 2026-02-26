import { BACKEND_URL } from "./config";

// a small wrapper that automatically attaches the stored token
// and handles 401 responses by clearing the token and reloading.
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  if (resp.status === 401) {
    // invalid/expired token: clear and force logout
    localStorage.removeItem("token");
    // simple reload triggers AuthManager to go back to login
    window.location.reload();
  }

  return resp;
}
