import { getApiBaseUrl, clearUiSessionCookieValue, setStoredAccessToken } from "./api";

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

  // Use a mutable headers record for easier updates during retry
  const headersRecord = {
    "Content-Type": "application/json",
    ...init.headers,
  } as Record<string, string>;

  const options: RequestInit = {
    ...init,
    credentials: "include",
    headers: headersRecord,
  };

  const response = await fetch(url, options);

  // If unauthorized, try to refresh
  if (
    response.status === 401 &&
    !path.includes("/api/auth/login") &&
    !path.includes("/api/auth/refresh-token")
  ) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          // If the original request had an Authorization header, update it
          if (headersRecord["Authorization"]) {
            headersRecord["Authorization"] = `Bearer ${newToken}`;
          }
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
        const json = await refreshRes.json();
        const newToken = json.data?.accessToken;

        if (newToken) {
          setStoredAccessToken(newToken);

          // Update the Authorization header for the retry
          if (headersRecord["Authorization"]) {
            headersRecord["Authorization"] = `Bearer ${newToken}`;
          }

          isRefreshing = false;
          onRefreshed(newToken);
          return fetch(url, options);
        }
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
