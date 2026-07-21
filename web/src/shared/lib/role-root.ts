/** Panel kök yolu: /admin, /bashekim, /mudur … */
export function roleRootFromPath(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg ? `/${seg}` : "/admin";
}
