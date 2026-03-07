import { getClient } from '../api/client.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { extract } from 'tar';
import { join } from 'node:path';
import { createGunzip } from 'node:zlib';
import { mkdir, unlink, readFile } from 'node:fs/promises';
import * as crypto from 'node:crypto';

function parseSkillRef(skill: string): { namespace: string; name: string; version?: string } {
  const parts = skill.split('@');
  const ref = parts[0].split('/');
  if (ref.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name or namespace/name@version');
  }
  return { namespace: ref[0], name: ref[1], version: parts[1] };
}

function getSkillsDir(): string {
  return join(process.cwd(), '.claude', 'skills');
}

export async function installCommand(skill: string, _options?: { global?: boolean }): Promise<void> {
  if (!skill) {
    console.error('Usage: skilo install <namespace/name[@version]>');
    process.exit(1);
  }

  try {
    const { namespace, name, version } = parseSkillRef(skill);
    const client = await getClient();

    // Get skill metadata to find the version
    const metadata = await client.getSkillMetadata(namespace, name);
    const versionToInstall = version || metadata.version;

    console.log(`Installing ${namespace}/${name}@${versionToInstall}...`);

    // Get verification info
    const verifyResponse = await fetch(`${client.baseUrl}/v1/skills/${namespace}/${name}/verify?version=${versionToInstall}`);
    let expectedChecksum: string | undefined;
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      expectedChecksum = verifyData.checksum;
      if (verifyData.signature) {
        console.log('✓ Skill is signed');
      }
    }

    // Download tarball
    const tarball = await client.downloadTarball(namespace, name, versionToInstall);

    // Verify checksum
    if (expectedChecksum) {
      const actualChecksum = crypto.createHash('sha256').update(Buffer.from(tarball)).digest('hex');
      if (actualChecksum !== expectedChecksum) {
        console.error('❌ Checksum verification failed!');
        console.error(`  Expected: ${expectedChecksum}`);
        console.error(`  Actual:   ${actualChecksum}`);
        process.exit(1);
      }
      console.log('✓ Checksum verified');
    }

    // Extract to skills directory
    const skillsDir = getSkillsDir();
    await mkdir(skillsDir, { recursive: true });

    const skillDir = join(skillsDir, `${namespace}-${name}`);
    await mkdir(skillDir, { recursive: true });

    // Write tarball to temp file and extract
    const tempPath = join(skillDir, 'temp.tgz');
    const writeStream = createWriteStream(tempPath);
    await writeStream.write(Buffer.from(tarball));
    writeStream.end();
    await new Promise<void>((resolve) => writeStream.on('finish', resolve));

    // Extract
    const readStream = createReadStream(tempPath);
    await pipeline(readStream, createGunzip(), extract({ cwd: skillDir }));

    // Clean up temp file
    await unlink(tempPath);

    console.log(`✓ Installed ${namespace}/${name}@${versionToInstall}`);
  } catch (e) {
    console.error(`Install failed: ${(e as Error).message}`);
    process.exit(1);
  }
}