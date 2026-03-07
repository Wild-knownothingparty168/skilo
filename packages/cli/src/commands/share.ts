import { getClient } from '../api/client.js';

function parseSkillRef(skill: string): { namespace: string; name: string } {
  const parts = skill.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name');
  }
  return { namespace: parts[0], name: parts[1] };
}

export async function shareCommand(
  skill: string,
  options: { oneTime?: boolean; expires?: string; uses?: number } = {}
): Promise<void> {
  if (!skill) {
    console.error('Usage: skilo share <namespace/name> [--one-time] [--expires in 1h] [--uses 5]');
    process.exit(1);
  }

  try {
    const { namespace, name } = parseSkillRef(skill);
    const client = await getClient();

    // Parse expires
    let expiresAt: number | undefined;
    if (options.expires) {
      const match = options.expires.match(/^(\d+)(h|d|m)$/);
      if (!match) {
        console.error('Invalid expires format. Use: 1h, 2d, 30m');
        process.exit(1);
      }
      const value = parseInt(match[1]);
      const unit = match[2];
      const now = Date.now();
      if (unit === 'h') expiresAt = now + value * 60 * 60 * 1000;
      else if (unit === 'd') expiresAt = now + value * 24 * 60 * 60 * 1000;
      else if (unit === 'm') expiresAt = now + value * 60 * 1000;
    }

    const result = await client.createShareLink(
      namespace,
      name,
      options.oneTime || false,
      expiresAt,
      options.uses
    );

    console.log(`✓ Created share link for ${namespace}/${name}`);
    console.log(`\n${result.url}`);
    if (options.oneTime) console.log('  (one-time use)');
    if (expiresAt) console.log(`  (expires: ${new Date(expiresAt).toISOString()})`);
    if (options.uses) console.log(`  (max uses: ${options.uses})`);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}