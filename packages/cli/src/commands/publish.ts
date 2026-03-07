import { getClient, loadConfig } from '../api/client.js';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { validateSkillContent } from '../manifest.js';
import * as tar from 'tar';
import { join } from 'node:path';
import * as crypto from 'node:crypto';
import { statSync, existsSync } from 'node:fs';
import { generateAnonName, generateClaimToken } from '../anon-names.js';
import { loadOrGenerateKeys, calculateChecksum, sign, encodeBase64Url } from '../utils/signing.js';

const SKILL_FILE = 'SKILL.md';
const SKILO_SECRET_FILE = '.skilo-secret';

async function createTarball(cwd: string): Promise<{ buffer: Buffer; size: number; checksum: string }> {
  const tempFile = join(cwd, '.skilo-temp.tgz');

  const files: string[] = [SKILL_FILE];
  try { statSync(join(cwd, 'index.js')); files.push('index.js'); } catch {}
  try { statSync(join(cwd, 'index.ts')); files.push('index.ts'); } catch {}
  try { statSync(join(cwd, 'src')); files.push('src'); } catch {}

  await tar.create({ cwd, gzip: true, file: tempFile }, files);

  const buffer = await readFile(tempFile);
  await unlink(tempFile);

  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  return { buffer, size: buffer.length, checksum };
}

export async function publishCommand(path?: string, options?: { sign?: boolean }): Promise<void> {
  const cwd = !path || path === '.' ? process.cwd() : path;
  const skillPath = join(cwd, SKILL_FILE);

  // Validate SKILL.md
  try {
    const content = await readFile(skillPath, 'utf-8');
    const result = validateSkillContent(content);
    if (!result.valid) {
      console.error('Publish failed: SKILL.md is invalid');
      for (const error of result.errors) console.error(`  ${error.field}: ${error.message}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`Error: ${SKILL_FILE} not found in ${cwd}`);
    process.exit(1);
  }

  try {
    const config = await loadConfig();
    const client = await getClient();
    const content = await readFile(skillPath, 'utf-8');
    const result = validateSkillContent(content);
    const manifest = result.manifest!;

    const { buffer, checksum } = await createTarball(cwd);

    // Sign if requested or if user is logged in
    let signature: string | undefined;
    let publicKey: string | undefined;

    if (options?.sign || config.token || config.apiKey) {
      try {
        const keys = await loadOrGenerateKeys();
        const checksumBytes = new TextEncoder().encode(checksum);
        const sig = await sign(checksumBytes, keys.privateKey);
        signature = encodeBase64Url(sig);
        publicKey = encodeBase64Url(keys.publicKey);
        console.log('✓ Signed skill bundle');
      } catch (e) {
        console.warn('Warning: Could not sign skill:', (e as Error).message);
      }
    }

    // Generate namespace - use config or generate anon name
    let namespace: string;
    let claimToken: string | undefined;

    if (config.token || config.apiKey) {
      // Logged in - use their username
      namespace = config.namespace || 'default';
    } else {
      // Anonymous - generate memorable name + claim token
      namespace = generateAnonName();
      claimToken = generateClaimToken();

      // Save claim token to file for later claiming
      await writeFile(join(cwd, SKILO_SECRET_FILE), claimToken, 'utf-8');
      console.log(`📝 Saved claim token to ${SKILO_SECRET_FILE}`);
    }

    const isListed = !!(config.token || config.apiKey);

    const response = await client.publishSkill(
      manifest.name,
      namespace,
      manifest.description,
      manifest.version || '0.1.0',
      buffer.buffer as ArrayBuffer,
      isListed,
      claimToken,
      signature,
      publicKey
    );

    console.log(`\n✓ Published @${namespace}/${manifest.name}@${manifest.version || '0.1.0'}`);

    if (!isListed && claimToken) {
      console.log(`  🔐 Claim token: ${claimToken}`);
      console.log(`\n  To claim this skill and make it public:`);
      console.log(`    skilo login`);
      console.log(`    skilo claim @${namespace}/${manifest.name} --token ${claimToken}`);
    } else if (isListed) {
      console.log('  (public)');
    }
  } catch (e) {
    console.error(`Publish failed: ${(e as Error).message}`);
    process.exit(1);
  }
}