import { describe, expect, it } from 'vitest';
import { parseTokenClaims } from './api-parsers';

const encode = (claims: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(claims));
  const base64 = btoa(String.fromCharCode(...bytes));
  return `header.${base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.signature`;
};

describe('parseTokenClaims', () => {
  it('decodes base64url claims, including non-ASCII text', () => {
    expect(parseTokenClaims(encode({ sub: 'user-1', email: 'josé@turnovivo.com', role: 'ADMIN' })))
      .toEqual({ sub: 'user-1', email: 'josé@turnovivo.com', role: 'ADMIN' });
  });

  it('defaults optional claims with the wrong type', () => {
    expect(parseTokenClaims(encode({ sub: 'user-1', email: 42 })))
      .toEqual({ sub: 'user-1', email: '', role: '' });
  });

  it.each([
    ['no payload segment', 'not-a-jwt'],
    ['invalid base64', 'header.%%%.signature'],
    ['non-JSON payload', `header.${btoa('hello')}.signature`],
    ['missing subject', encode({ role: 'ADMIN' })],
    ['array payload', encode(['user-1'])],
  ])('returns null for %s', (_label, token) => {
    expect(parseTokenClaims(token)).toBeNull();
  });
});
