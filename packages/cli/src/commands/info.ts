import { getClient } from '../api/client.js';
import { exitWithError, isJsonOutput, printJson, printKeyValue, printSection, printUsage } from '../utils/output.js';

function parseSkillRef(skill: string): { namespace: string; name: string } {
  const parts = skill.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name');
  }
  return { namespace: parts[0], name: parts[1] };
}

export async function infoCommand(skill: string): Promise<void> {
  if (!skill) {
    printUsage(['Usage: skilo info <namespace/name>']);
  }

  try {
    const { namespace, name } = parseSkillRef(skill);
    const client = await getClient();
    const metadata = await client.getSkillMetadata(namespace, name);

    if (isJsonOutput()) {
      printJson({
        command: 'info',
        skill,
        metadata,
      });
      return;
    }

    printSection(`${metadata.namespace}/${metadata.name}`, 'primary');
    printKeyValue('description', metadata.description);
    printKeyValue('version', metadata.version);
    printKeyValue('size', formatBytes(metadata.size));
    printKeyValue('checksum', `${metadata.checksum.slice(0, 16)}...`);
    if (metadata.author) printKeyValue('author', metadata.author);
    if (metadata.homepage) printKeyValue('homepage', metadata.homepage);
    if (metadata.repository) printKeyValue('repository', metadata.repository);
    if (metadata.keywords?.length) printKeyValue('keywords', metadata.keywords.join(', '));
  } catch (e) {
    exitWithError(`Info failed: ${(e as Error).message}`);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
