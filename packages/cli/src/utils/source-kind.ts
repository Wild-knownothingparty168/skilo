import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

export function normalizeSourceInput(source: string): string {
  const trimmed = source.trim();

  if (/^(skilo\.xyz|www\.skilo\.xyz)\/(s|p)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  if (/^github\.com\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export async function isRegistrySkillRef(source: string): Promise<boolean> {
  source = normalizeSourceInput(source);

  if (
    source.startsWith('github:') ||
    source.startsWith('http://') ||
    source.startsWith('https://') ||
    source.endsWith('.skl') ||
    source.startsWith('.') ||
    source.startsWith('/') ||
    source.startsWith('~')
  ) {
    return false;
  }

  try {
    await access(resolve(source));
    return false;
  } catch {
    // Treat unresolved non-URL input as a registry ref candidate.
  }

  const [ref] = source.split('@');
  const parts = ref.split('/');
  return parts.length === 2 && parts.every(Boolean);
}
