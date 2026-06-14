export function getSessionRefreshPath(nextPath: string) {
  return `/auth/session?next=${encodeURIComponent(nextPath)}`;
}
