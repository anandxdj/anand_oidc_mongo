import { cookies } from "next/headers";

import { getApiBaseUrl } from "@/lib/api";

export async function buildCookieHeader(): Promise<string> {
  const jar = await cookies();
  return jar
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");
}

export async function fetchApi(path: string, init: RequestInit = {}) {
  const cookie = await buildCookieHeader();
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...Object.fromEntries(new Headers(init.headers).entries()),
      cookie,
    },
    cache: "no-store",
  });
}
