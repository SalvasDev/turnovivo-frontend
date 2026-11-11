import { DEFAULT_DEMO_PATH } from '@/config/app';

export const SUPER_ADMIN_PATH = '/super-admin';

export const isSuperAdmin = (role: string | undefined) => role === 'SUPER_ADMIN';

export const canAccessAdmin = (role: string | undefined) => role === 'ADMIN' || role === 'STAFF';

export const getHomePathForRole = (role: string | undefined) =>
  isSuperAdmin(role) ? SUPER_ADMIN_PATH : DEFAULT_DEMO_PATH;

/** Only same-origin paths are allowed, preventing open redirects through `?next=`. */
export function getSafeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}

export const getLoginPath = (returnPath: string) => `/login?next=${encodeURIComponent(returnPath)}`;
