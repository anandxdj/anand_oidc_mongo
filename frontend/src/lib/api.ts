/** Cookie on the Next.js origin so middleware can detect a recent sign-in (API auth cookies live on the API host). */
export const UI_SESSION_COOKIE = "oidc_ui_session";

export const UI_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  return raw.replace(/\/$/, "");
}

export function uiSessionCookieValue(): string {
  return `${UI_SESSION_COOKIE}=1; Path=/; Max-Age=${UI_SESSION_MAX_AGE_SEC}; SameSite=Lax`;
}

export function clearUiSessionCookieValue(): string {
  return `${UI_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export type ProjectRow = {
  _id: string;
  name: string;
  description?: string;
  companyName?: string;
  supportEmail?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OAuthClientRow = {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  description?: string;
  logoUrl?: string;
  suspended?: boolean;
  createdAt?: string;
  projectId?: string;
};
