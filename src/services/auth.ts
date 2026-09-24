/**
 * Authentication Service for Fast URL Indexer Admin Panel
 */

export interface AdminUser {
  username: string;
  email: string;
  role?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
}

const TOKEN_KEY = 'fast_indexer_admin_token';
const USER_KEY = 'fast_indexer_admin_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: AdminUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to store auth session', err);
  }
}

export function getStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth session', err);
  }
}

// Global fetch interceptor to automatically attach Authorization header to all /api/ requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = getStoredToken();
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

    if (token && urlString && urlString.includes('/api/') && !urlString.includes('/api/auth/login')) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('x-admin-token')) {
        headers.set('x-admin-token', token);
      }
      init.headers = headers;
    }

    const response = await originalFetch(input, init);

    // If unauthorized and session expired, trigger re-login
    if (response.status === 401 && urlString && urlString.includes('/api/indexing/')) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('admin_auth_expired'));
    }

    return response;
  };
}

export async function loginAdmin(identifier: string, password: string): Promise<{ success: boolean; user?: AdminUser; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Authentication failed' };
    }
    setStoredAuth(data.token, data.user);
    return { success: true, user: data.user, token: data.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to login service' };
  }
}

export async function checkAuthMe(): Promise<{ authenticated: boolean; user?: AdminUser }> {
  const token = getStoredToken();
  if (!token) return { authenticated: false };

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-admin-token': token
      }
    });
    if (!res.ok) {
      clearStoredAuth();
      return { authenticated: false };
    }
    const data = await res.json();
    if (data.authenticated && data.user) {
      return { authenticated: true, user: data.user };
    }
    clearStoredAuth();
    return { authenticated: false };
  } catch {
    // If offline, trust stored user temporarily if token exists
    const storedUser = getStoredUser();
    if (storedUser && token) {
      return { authenticated: true, user: storedUser };
    }
    return { authenticated: false };
  }
}

export async function logoutAdmin(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-admin-token': token
        }
      });
    } catch {}
  }
  clearStoredAuth();
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update password' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating password' };
  }
}
