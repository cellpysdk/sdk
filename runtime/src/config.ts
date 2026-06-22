// Captured at module load time — document.currentScript is null after the script tag fires.
// In ESM/CJS (npm), this will always be null; only the IIFE build runs inside a <script> tag.
const _scriptEl =
  typeof document !== 'undefined'
    ? (document.currentScript as HTMLScriptElement | null)
    : null;

const DEFAULT_PROD = 'https://cdn.cellpy.com';
const DEFAULT_STAGING = 'https://staging-cdn.cellpy.com';
const DEFAULT_API_PROD = 'https://cellpy.com';
const DEFAULT_API_STAGING = 'https://staging.cellpy.com';

type Env = 'production' | 'staging';

declare global {
  interface Window {
    CELLPY_ENV?: string;
    CELLPY_CDN?: string;
    CELLPY_CDN_STAGING?: string;
    CELLPY_CDN_PRODUCTION?: string;
    CELLPY_API?: string;
    CELLPY_API_STAGING?: string;
  }
}

function getEnv(): Env {
  if (typeof window !== 'undefined' && window.CELLPY_ENV === 'staging') {
    return 'staging';
  }
  if (_scriptEl?.dataset['env'] === 'staging') {
    return 'staging';
  }
  return 'production';
}

export function resolveCdnBase(): string {
  const env = getEnv();

  if (env === 'staging') {
    return (
      window.CELLPY_CDN_STAGING ??
      _scriptEl?.dataset['cdnStaging'] ??
      DEFAULT_STAGING
    );
  }

  // production (default)
  return (
    window.CELLPY_CDN_PRODUCTION ??
    _scriptEl?.dataset['cdnProduction'] ??
    window.CELLPY_CDN ??
    _scriptEl?.dataset['cdn'] ??
    DEFAULT_PROD
  );
}

export function resolveUrl(slug: string): string {
  return `${resolveCdnBase()}/containers/${slug}.json`;
}

export function resolveApiBase(): string {
  const env = getEnv();
  if (env === 'staging') {
    return window.CELLPY_API_STAGING ?? _scriptEl?.dataset['apiStaging'] ?? DEFAULT_API_STAGING;
  }
  return window.CELLPY_API ?? _scriptEl?.dataset['api'] ?? DEFAULT_API_PROD;
}
