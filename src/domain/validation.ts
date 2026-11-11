export function getEmailError(value: string) {
  if (!value.trim()) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
  return null;
}

export function getPasswordError(value: string) {
  if (!value) return 'Enter a password.';
  return value.length >= 8 && /[0-9]/.test(value)
    ? null
    : 'Use at least 8 characters, including one number.';
}

export type ServerErrorField = 'slug' | 'name' | 'email' | 'password' | 'owner';

// Ordered by specificity: a "slug name" message belongs to the slug field.
const SERVER_ERROR_PATTERNS: ReadonlyArray<readonly [ServerErrorField, RegExp]> = [
  ['slug', /slug|url/i],
  ['name', /name/i],
  ['email', /e-?mail/i],
  ['password', /password/i],
  ['owner', /owner|admin/i],
];

/** Maps a server validation message to the form field it refers to, if that field is on screen. */
export function getServerErrorField<F extends ServerErrorField>(message: string, fields: readonly F[]): F | null {
  for (const [field, pattern] of SERVER_ERROR_PATTERNS) {
    const onScreen = fields.find(candidate => candidate === field);
    if (onScreen && pattern.test(message)) return onScreen;
  }
  return null;
}
