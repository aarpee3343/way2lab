export const getBaseUrl = () => {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return 'https://www.waytolab.com';
};

export const absoluteUrl = (path: string) => {
  const base = getBaseUrl();
  if (!path.startsWith('/')) return `${base}/${path}`;
  return `${base}${path}`;
};

export const truncate = (value: string, max = 160) => {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trim()}…`;
};

export const toSlug = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

