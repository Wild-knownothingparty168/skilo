import { getClient } from '../api/client.js';

function parseSkillRef(skill: string): { namespace: string; name: string; version?: string } {
  const atParts = skill.split('@');
  const refPart = atParts[0];
  const version = atParts[1];
  const ref = refPart.split('/');
  if (ref.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name@version');
  }
  return { namespace: ref[0], name: ref[1], version };
}

export async function yankCommand(skill: string, reason?: string): Promise<void> {
  if (!skill) {
    console.error('Usage: skilo yank <namespace/name@version> [reason]');
    process.exit(1);
  }

  try {
    const { namespace, name, version } = parseSkillRef(skill);
    if (!version) {
      console.error('Version required. Use: skilo yank namespace/name@1.0.0');
      process.exit(1);
    }

    const client = await getClient();
    await client.yankVersion(namespace, name, version, reason);
    console.log(`✓ Yanked ${namespace}/${name}@${version}`);
    if (reason) console.log(`  Reason: ${reason}`);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}