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
