import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function isRegistrySkillRef(source: string): Promise<boolean> {
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
