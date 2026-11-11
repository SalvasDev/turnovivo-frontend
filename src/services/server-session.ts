import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEFAULT_DEMO_PATH } from '@/config/app';
import { getLoginPath } from '@/domain/access';
import type { TokenClaims } from '@/types';
import { parseTokenClaims } from './api-parsers';
import { TOKEN_COOKIE } from './session';

/** Server-component guard: redirects to login without a valid session, or home when the role is not allowed. */
export async function requireSession(
  returnPath: string,
  isAllowed: (role: string) => boolean = () => true,
): Promise<{ token: string; claims: TokenClaims }> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const claims = token ? parseTokenClaims(token) : null;
  if (!token || !claims) redirect(getLoginPath(returnPath));
  if (!isAllowed(claims.role)) redirect(DEFAULT_DEMO_PATH);
  return { token, claims };
}
