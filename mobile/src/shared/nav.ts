import { router, type Href } from "expo-router";

/** Typed routes regen öncesi yeni path'ler için güvenli push/replace. */
export function go(path: string) {
  router.push(path as Href);
}

export function goReplace(path: string) {
  router.replace(path as Href);
}

export function asHref(path: string): Href {
  return path as Href;
}
