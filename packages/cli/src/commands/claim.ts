import { getClient, loadConfig, saveConfig } from '../api/client.js';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const SKILO_SECRET_FILE = '.skilo-secret';

export async function claimCommand(fullName: string, options: { token?: string } = {}): Promise<void> {
  if (!fullName) {
    console.error('Usage: skilo claim <namespace/name> [--token TOKEN]');
    console.error('\nExample: skilo claim fuzzycat-mango-123 --token apple-rose-456');
    console.error('\nOr from the project with .skilo-secret:');
    console.error('  skilo claim fuzzycat-mango-123');
    process.exit(1);
  }

  try {
    const config = await loadConfig();

    if (!config.token && !config.apiKey) {
      console.error('Login required to claim a skill.');
      console.error('Run: skilo login');
      process.exit(1);
    }

    // Get token - from CLI or from .skilo-secret file
    let token = options.token;

    if (!token) {
      // Try to read from .skilo-secret in current dir
      try {
        token = await readFile(SKILO_SECRET_FILE, 'utf-8');
      } catch {
        console.error('No token provided and no .skilo-secret file found.');
        console.error('Provide --token or run from the project directory.');
        process.exit(1);
      }
    }

    const client = await getClient();
    await client.claimSkill(fullName, token);

    // Clean up secret file if it exists
    try {
      await unlink(join(process.cwd(), SKILO_SECRET_FILE));
    } catch {
      // File might not exist, ignore
    }

    // Update config with new namespace if this was the anon name
    if (config.namespace && fullName.includes(config.namespace)) {
      // Already claiming to same namespace, nothing to update
    }

    console.log(`✓ Claimed ${fullName}`);
    console.log('\nYou now own this skill. Republish to make it listed:');
    console.log('  skilo publish .');
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}