import { getClient } from '../api/client.js';
import { createInterface } from 'node:readline';
import { resolveSkillLocation } from '../utils/skill-file.js';
import { publishLocalSkill } from './publish.js';
import { isKnownTool, discoverSkills } from '../tool-dirs.js';
import { pickSkills } from '../utils/picker.js';

function parseSkillRef(skill: string): { namespace: string; name: string } {
  const parts = skill.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name');
  }
  return { namespace: parts[0], name: parts[1] };
}

async function promptPassword(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter password: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

export async function shareCommand(
  skill: string,
  options: { oneTime?: boolean; expires?: string; uses?: number; password?: boolean; qr?: boolean; yes?: boolean } = {}
): Promise<void> {
  if (isKnownTool(skill)) {
    await bulkShareCommand(skill, options);
    return;
  }

  if (!skill) {
    console.error('Usage: skilo share <path|namespace/name> [--one-time] [--expires 1h] [--uses 5] [--password]');
    process.exit(1);
  }

  try {
    const target = await resolveShareTarget(skill);
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

    // Get password if requested
    let password: string | undefined;
    if (options.password) {
      password = await promptPassword();
    }

    const result = await client.createShareLink(
      target.namespace,
      target.name,
      options.oneTime || false,
      expiresAt,
      options.uses,
      password
    );

    if (target.publishedVersion) {
      console.log(`✓ Published @${target.namespace}/${target.name}@${target.publishedVersion} for sharing`);
    }

    console.log(`✓ Created share link for ${target.namespace}/${target.name}`);
    console.log(`\n${result.url}`);
    if (options.oneTime) console.log('  (one-time use)');
    if (expiresAt) console.log(`  (expires: ${new Date(expiresAt).toISOString()})`);
    if (options.uses) console.log(`  (max uses: ${options.uses})`);
    if (options.password) console.log('  (password protected)');

    // QR code (ASCII representation)
    if (options.qr) {
      console.log('\nScan to install:');
      console.log(generateQRCode(result.url));
    }
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

// Simple ASCII QR code generator (placeholder)
function generateQRCode(url: string): string {
  // In production, use a proper QR library like 'qrcode'
  // For now, return a placeholder
  return `
    ██████████████
    ██          ██
    ██  ██████  ██
    ██  █    █  ██
    ██  ██████  ██
    ██          ██
    ██████████████
           ${url.slice(0, 30)}...
  `;
}

async function bulkShareCommand(
  toolName: string,
  options: { oneTime?: boolean; expires?: string; uses?: number; password?: boolean; qr?: boolean; yes?: boolean }
): Promise<void> {
  console.log(`Scanning ${toolName === 'all' ? 'all tools' : toolName} for skills...`);

  const skills = await discoverSkills(toolName);
  if (skills.length === 0) {
    console.log('No skills found.');
    return;
  }

  console.log(`Found ${skills.length} skill(s):\n`);

  let selected;
  if (options.yes) {
    selected = skills;
  } else {
    const result = await pickSkills(skills);
    if (result.cancelled || result.selected.length === 0) {
      console.log('No skills selected.');
      return;
    }
    selected = result.selected;
  }

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

  // Get password if requested
  let password: string | undefined;
  if (options.password) {
    password = await promptPassword();
  }

  const client = await getClient();
  const total = selected.length;

  console.log(`\nPublishing ${total} skill(s)...`);

  const successes: { name: string; token: string; url: string }[] = [];
  const failures: { name: string; error: string }[] = [];

  for (let i = 0; i < total; i++) {
    const skill = selected[i];
    process.stdout.write(`  [${i + 1}/${total}] ${skill.name} ...`);

    try {
      const { manifest, namespace } = await publishLocalSkill(skill.path);
      const result = await client.createShareLink(
        namespace,
        manifest.name,
        options.oneTime || false,
        expiresAt,
        options.uses,
        password
      );
      console.log(' done');
      successes.push({ name: skill.name, token: result.token, url: result.url });
    } catch (e) {
      console.log(` FAILED (${(e as Error).message})`);
      failures.push({ name: skill.name, error: (e as Error).message });
    }
  }

  console.log('');

  if (successes.length >= 2) {
    try {
      const tokens = successes.map((s) => s.token);
      const packResult = await client.createPack(toolName, tokens);
      console.log(`Pack (${packResult.count} skills): ${packResult.url}`);
    } catch (e) {
      console.error(`Pack creation failed: ${(e as Error).message}`);
    }
  }

  if (successes.length > 0) {
    const maxNameLen = Math.max(...successes.map((s) => s.name.length));
    console.log('Individual links:');
    for (const s of successes) {
      console.log(`  ${s.name.padEnd(maxNameLen)}  \u2192 ${s.url}`);
    }
  }

  if (failures.length > 0) {
    console.log(`\nFailed (${failures.length}):`);
    for (const f of failures) {
      console.log(`  ${f.name}: ${f.error}`);
    }
  }
}

async function resolveShareTarget(skill: string): Promise<{ namespace: string; name: string; publishedVersion?: string }> {
  try {
    await resolveSkillLocation(skill);
  } catch (e) {
    const message = (e as Error).message;
    if (message.startsWith('Path not found:')) {
      const { namespace, name } = parseSkillRef(skill);
      return { namespace, name };
    }

    throw e;
  }

  const { manifest, namespace } = await publishLocalSkill(skill);
  return {
    namespace,
    name: manifest.name,
    publishedVersion: manifest.version || '0.1.0',
  };
}
