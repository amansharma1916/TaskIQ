import { clearAuthSession, getAuthSession, type AuthUser, updateAccessToken } from './auth';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

const buildUrl = (pathOrUrl: string): string => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const apiBase = import.meta.env.VITE_BACKEND_URL ?? '';
  return `${apiBase}${pathOrUrl}`;
};

const refreshTokens = async (): Promise<boolean> => {
  const session = getAuthSession();
  if (!session?.refreshToken) {
    return false;
  }

  const response = await fetch(buildUrl('/api/auth/users/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  const result = await response.json().catch(() => null) as {
    accessToken?: string;
    refreshToken?: string;
    user?: AuthUser;
  } | null;

  if (!response.ok || !result?.accessToken || !result?.refreshToken) {
    return false;
  }

  updateAccessToken(result.accessToken, result.refreshToken, result.user ?? session.user);
  return true;
};

export const authorizedFetch = async (pathOrUrl: string, options: RequestOptions = {}): Promise<Response> => {
  const { skipAuth = false, headers, ...rest } = options;
  const session = getAuthSession();

  const requestHeaders = new Headers(headers);
  if (!skipAuth && session?.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${session.accessToken}`);
  }

  let response = await fetch(buildUrl(pathOrUrl), {
    ...rest,
    headers: requestHeaders,
  });

  if (skipAuth || response.status !== 401) {
    return response;
  }

  const refreshed = await refreshTokens();
  if (!refreshed) {
    clearAuthSession();
    return response;
  }

  const nextSession = getAuthSession();
  if (!nextSession?.accessToken) {
    clearAuthSession();
    return response;
  }

  requestHeaders.set('Authorization', `Bearer ${nextSession.accessToken}`);
  response = await fetch(buildUrl(pathOrUrl), {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  return response;
};
