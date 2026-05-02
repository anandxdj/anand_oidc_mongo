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

export type UserProfile = {
  _id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  profilePictureUrl?: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  country?: string;
  termsAcceptedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

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

/** Standard API JSON envelope from the Express backend. */
export type ApiJson<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type AdminStats = {
  totalUsers: number;
  totalOAuthClients: number;
  authCodesIssuedToday: number;
  activeAccessTokensApprox: number;
};

export type AdminClientOwner = { _id?: string; email?: string; name?: string };
export type AdminClientProject = { _id?: string; name?: string; isDefault?: boolean };

export type AdminOAuthClientRow = {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  description?: string;
  suspended?: boolean;
  suspendedReason?: string;
  suspendedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: AdminClientOwner | null;
  projectId?: AdminClientProject | null;
};

export type AdminUserRow = {
  _id: string;
  email: string;
  name?: string;
  role?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUsersPageResponse = {
  items: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
};

export type AdminAuthorizedApp = {
  clientId: string;
  scope?: string;
  grantedAt?: string;
  clientName?: string | null;
  clientSuspended?: boolean;
};

export type AdminAuthorizedAppsResponse = {
  userId: string;
  email: string;
  apps: AdminAuthorizedApp[];
};

export type UserSessionRow = {
  id: string;
  sessionKey: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt?: string;
  lastSeenAt?: string;
  isCurrent?: boolean;
};

export type UserAuthorizedAppRow = {
  clientId: string;
  clientName?: string;
  logoUrl?: string;
  scope?: string;
  grantedAt?: string;
  clientSuspended?: boolean;
};
