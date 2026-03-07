// Inspect skill without installing
import { getClient } from '../api/client.js';

export async function inspectCommand(source: string): Promise<void> {
  if (!source) {
    console.error('Usage: skilo inspect <skill>');
    console.error('');
    console.error('Examples:');
    console.error('  skilo inspect namespace/name');
    console.error('  skilo inspect https://skilo.xyz/s/abc123');
    process.exit(1);
  }

  try {
    let skill: {
      name: string;
      namespace: string;
      description?: string;
      version?: string;
      author?: string | null;
      homepage?: string | null;
      repository?: string | null;
      keywords?: string[];
      checksum?: string;
      size?: number;
    };

    if (source.startsWith('https://skilo.xyz/s/')) {
      // Inspect share link
      const token = source.split('/s/')[1];
      const client = await getClient();
      const response = await fetch(`${client.baseUrl}/v1/skills/share/${token}`);

      if (!response.ok) {
        throw new Error('Invalid or expired share link');
      }

      const data = await response.json();
      if (data.requiresPassword) {
        console.log('🔒 This skill is password protected');
        return;
      }
      skill = data.skill;
    } else if (source.includes('/')) {
      // Inspect by namespace/name
      const [namespace, name] = source.split('/');
      const client = await getClient();
      skill = await client.getSkillMetadata(namespace, name);

      // Also get verification info
      const verifyResponse = await fetch(`${client.baseUrl}/v1/skills/${namespace}/${name}/verify`);
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        skill.checksum = verifyData.checksum;
      }
    } else {
      throw new Error('Invalid skill reference. Use: namespace/name or https://skilo.xyz/s/...');
    }

    // Display
    console.log('');
    console.log(`${skill.namespace}/${skill.name}`);
    console.log('=' .repeat(40));
    console.log('');

    if (skill.description) {
      console.log(`Description: ${skill.description}`);
    }
    if (skill.version) {
      console.log(`Version:     ${skill.version}`);
    }
    if (skill.author) {
      console.log(`Author:      ${skill.author}`);
    }
    if (skill.homepage) {
      console.log(`Homepage:    ${skill.homepage}`);
    }
    if (skill.repository) {
      console.log(`Repository:  ${skill.repository}`);
    }
    if (skill.keywords && skill.keywords.length > 0) {
      console.log(`Keywords:    ${skill.keywords.join(', ')}`);
    }
    if (skill.size) {
      console.log(`Size:        ${(skill.size / 1024).toFixed(2)} KB`);
    }
    if (skill.checksum) {
      console.log(`Checksum:    ${skill.checksum.substring(0, 16)}...`);
    }

    console.log('');
    console.log('To install, run:');
    console.log(`  skilo add ${source}`);
  } catch (e) {
    console.error(`Inspect failed: ${(e as Error).message}`);
    process.exit(1);
  }
}
