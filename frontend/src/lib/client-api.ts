import { getApiBaseUrl, clearUiSessionCookieValue } from "./api";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Client-side fetch wrapper that handles:
 * 1. Base URL prepending
 * 2. Automatic credentials (cookies)
 * 3. Token refresh on 401
 */
export async function clientFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const apiBase = getApiBaseUrl();
  const url = path.startsWith("http") ? path : apiBase + path;

  const options: RequestInit = {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  };

  const response = await fetch(url, options);

  // If unauthorized, try to refresh
  if (response.status === 401 && !path.includes("/api/auth/login") && !path.includes("/api/auth/refresh-token")) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(fetch(url, options));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(apiBase + "/api/auth/refresh-token", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        isRefreshing = false;
        onRefreshed("refreshed");
        return fetch(url, options);
      }
    } catch (err) {
      console.error("Refresh token failed", err);
    } finally {
      isRefreshing = false;
    }

    // If refresh failed, clear session
    if (typeof window !== "undefined") {
      document.cookie = clearUiSessionCookieValue();
    }
  }

  return response;
}
