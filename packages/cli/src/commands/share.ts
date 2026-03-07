import { getClient } from '../api/client.js';
import { createInterface } from 'node:readline';

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
  options: { oneTime?: boolean; expires?: string; uses?: number; password?: boolean; qr?: boolean } = {}
): Promise<void> {
  if (!skill) {
    console.error('Usage: skilo share <namespace/name> [--one-time] [--expires 1h] [--uses 5] [--password]');
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

    // Get password if requested
    let password: string | undefined;
    if (options.password) {
      password = await promptPassword();
    }

    const result = await client.createShareLink(
      namespace,
      name,
      options.oneTime || false,
      expiresAt,
      options.uses,
      password
    );

    console.log(`✓ Created share link for ${namespace}/${name}`);
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