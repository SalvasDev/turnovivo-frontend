const DEFAULT_SLUG_FALLBACK = 'barberia-premium';

export const DEFAULT_DEMO_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG?.trim() || DEFAULT_SLUG_FALLBACK;

export const DEFAULT_DEMO_PATH = `/${DEFAULT_DEMO_SLUG}`;

function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const DEFAULT_DEMO_NAME =
  process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_NAME?.trim() || slugToDisplayName(DEFAULT_DEMO_SLUG);

const FALLBACK_TIME_ZONE = 'America/Mexico_City';
const FALLBACK_LOCALE = 'en-US';

function resolveTimeZone(value: string | undefined) {
  const zone = value?.trim() || FALLBACK_TIME_ZONE;
  try {
    new Intl.DateTimeFormat(FALLBACK_LOCALE, { timeZone: zone });
    return zone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

function resolveLocale(value: string | undefined) {
  const locale = value?.trim();
  return locale && Intl.DateTimeFormat.supportedLocalesOf(locale).length > 0 ? locale : FALLBACK_LOCALE;
}

/**
 * The business's IANA zone: every date is shown and grouped here, never in the visitor's
 * or the server's zone, so SSR and the browser agree. Keep it equal to the backend clock's zone.
 */
export const BUSINESS_TIME_ZONE = resolveTimeZone(process.env.NEXT_PUBLIC_BUSINESS_TIME_ZONE);

/** Locale for every Intl formatter and the date picker; it should match the UI copy language. */
export const APP_LOCALE = resolveLocale(process.env.NEXT_PUBLIC_APP_LOCALE);
