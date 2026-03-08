import type { CatalogEntry } from "../api/skilo";

export interface PackTrayItem {
  canonicalRef: string;
  installRef: string;
  sourceKind: CatalogEntry["sourceKind"];
  owner: string;
  name: string;
  description: string;
  pageUrl: string | null;
  trust: CatalogEntry["trust"];
}

const STORAGE_KEY = "skilo:v2:pack-tray";

export function readPackTray(): PackTrayItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePackTray(items: PackTrayItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function toPackTrayItem(entry: CatalogEntry): PackTrayItem {
  return {
    canonicalRef: entry.canonicalRef,
    installRef: entry.installRef,
    sourceKind: entry.sourceKind,
    owner: entry.owner,
    name: entry.name,
    description: entry.description,
    pageUrl: entry.pageUrl,
    trust: entry.trust,
  };
}

export function addPackTrayItem(
  current: PackTrayItem[],
  entry: CatalogEntry
): PackTrayItem[] {
  if (current.some((item) => item.canonicalRef === entry.canonicalRef)) {
    return current;
  }

  return [...current, toPackTrayItem(entry)];
}
