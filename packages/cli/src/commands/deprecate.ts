import { getClient } from '../api/client.js';

function parseSkillRef(skill: string): { namespace: string; name: string } {
  const parts = skill.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name');
  }
  return { namespace: parts[0], name: parts[1] };
}

export async function deprecateCommand(skill: string, message?: string): Promise<void> {
  if (!skill) {
    console.error('Usage: skilo deprecate <namespace/name> [message]');
    process.exit(1);
  }

  try {
    const { namespace, name } = parseSkillRef(skill);
    const client = await getClient();

    await client.deprecateSkill(namespace, name, message || 'This skill is deprecated');
    console.log(`✓ Deprecated ${namespace}/${name}`);
    if (message) console.log(`  Message: ${message}`);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}