/**
 * Joins the configured API base URL with a relative endpoint path.
 *
 * An empty base URL produces a root-relative URL, which supports deployments
 * where the API is served from the same origin as the application.
 */
export function buildApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  const normalizedPath = path.trim().replace(/^\/+/, '');

  if (!normalizedBase) {
    return `/${normalizedPath}`;
  }

  return `${normalizedBase}/${normalizedPath}`;
}
