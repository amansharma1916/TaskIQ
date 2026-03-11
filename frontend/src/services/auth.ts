import type { RoleId } from '../config/roles';
import { getRoleDefaultRoute } from '../config/roles';

export type UserRole = RoleId;

export type AuthUser = {
  id?: string;
  name?: string;
  workEmail?: string;
  companyId?: string | null;
  companyName?: string | null;
  teamSize?: string | null;
  role?: UserRole;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number | null;
};

type AuthResponse = {
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
};

const AUTH_STORAGE_KEY = 'authSession';
const LEGACY_USER_KEY = 'user';
const AUTH_CHANGED_EVENT = 'taskiq-auth-changed';

const dispatchAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

const decodeJwtExpiry = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const parseSession = (raw: string): AuthSession | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string') {
      return null;
    }

    return {
      user: (parsed.user ?? {}) as AuthUser,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      accessTokenExpiresAt:
        typeof parsed.accessTokenExpiresAt === 'number' ? parsed.accessTokenExpiresAt : decodeJwtExpiry(parsed.accessToken),
    };
  } catch {
    return null;
  }
};

const parseLegacyUser = (): AuthUser | null => {
  const legacyUserRaw = localStorage.getItem(LEGACY_USER_KEY);
  if (!legacyUserRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(legacyUserRaw) as AuthUser;
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(LEGACY_USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(LEGACY_USER_KEY);
    return null;
  }
};

export const getAuthSession = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    const parsed = parseSession(raw);
    if (parsed) {
      return parsed;
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return null;
};

export const getAuthUser = (): AuthUser | null => {
  const session = getAuthSession();
  if (session?.user) {
    return session.user;
  }

  // One-time backward compatibility for existing localStorage shape.
  return parseLegacyUser();
};

export const saveAuthSession = (response: AuthResponse): AuthSession => {
  const accessToken = response.accessToken;
  const refreshToken = response.refreshToken;

  if (!accessToken || !refreshToken) {
    throw new Error('Auth response missing tokens');
  }

  const session: AuthSession = {
    user: (response.user ?? {}) as AuthUser,
    accessToken,
    refreshToken,
    accessTokenExpiresAt: decodeJwtExpiry(accessToken),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(session.user));
  dispatchAuthChange();

  return session;
};

export const updateAccessToken = (accessToken: string, refreshToken: string, user?: AuthUser): AuthSession => {
  const current = getAuthSession();
  const next: AuthSession = {
    user: user ?? current?.user ?? {},
    accessToken,
    refreshToken,
    accessTokenExpiresAt: decodeJwtExpiry(accessToken),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(next.user));
  dispatchAuthChange();

  return next;
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  dispatchAuthChange();
};

export const hasValidAccessToken = (): boolean => {
  const session = getAuthSession();
  if (!session?.accessToken) {
    return false;
  }

  if (!session.accessTokenExpiresAt) {
    return true;
  }

  return session.accessTokenExpiresAt > Date.now();
};

export const getAuthChangedEventName = (): string => AUTH_CHANGED_EVENT;

export const getDashboardRouteForRole = (role?: UserRole): string => {
  return getRoleDefaultRoute(role);
};

export const logoutSession = async (apiBase: string): Promise<void> => {
  try {
    const session = getAuthSession();
    if (session?.refreshToken) {
      await fetch(`${apiBase}/api/auth/users/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    }
  } finally {
    clearAuthSession();
  }
};
