import { getClient } from '../api/client.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { extract } from 'tar';
import { join } from 'node:path';
import { createGunzip } from 'node:zlib';
import { mkdir, rm, unlink } from 'node:fs/promises';
import * as crypto from 'node:crypto';
import { isRegistrySkillRef } from '../utils/source-kind.js';
import { type InstallOptions, describeInstallTargets, getInstallDirs } from '../utils/install-targets.js';
import { exitWithError, logInfo, logSuccess, printNote, printUsage } from '../utils/output.js';

function parseSkillRef(skill: string): { namespace: string; name: string; version?: string } {
  const parts = skill.split('@');
  const ref = parts[0].split('/');
  if (ref.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name or namespace/name@version');
  }
  return { namespace: ref[0], name: ref[1], version: parts[1] };
}

export async function installCommand(skill: string, options: InstallOptions = {}): Promise<void> {
  if (!skill) {
    printUsage(['Usage: skilo install <skill|source>']);
  }

  try {
    if (!await isRegistrySkillRef(skill)) {
      const { importCommand } = await import('./import.js');
      await importCommand(skill, options);
      return;
    }

    const { namespace, name, version } = parseSkillRef(skill);
    const client = await getClient();

    // Get skill metadata to find the version
    const metadata = await client.getSkillMetadata(namespace, name);
    const versionToInstall = version || metadata.version;

    logInfo(`Installing ${namespace}/${name}@${versionToInstall}`);

    // Get verification info
    const verifyResponse = await fetch(`${client.baseUrl}/v1/skills/${namespace}/${name}/verify?version=${versionToInstall}`);
    let expectedChecksum: string | undefined;
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      expectedChecksum = verifyData.checksum;
      if (verifyData.signature) {
        printNote('signature', 'present');
      }
    }

    // Download tarball
    const tarball = await client.downloadTarball(namespace, name, versionToInstall);

    // Verify checksum
    if (expectedChecksum) {
      const actualChecksum = crypto.createHash('sha256').update(Buffer.from(tarball)).digest('hex');
      if (actualChecksum !== expectedChecksum) {
        exitWithError(`Checksum verification failed. expected=${expectedChecksum} actual=${actualChecksum}`);
      }
      printNote('checksum', 'verified');
    }

    const installDirs = getInstallDirs(options);

    for (const skillsDir of installDirs) {
      await mkdir(skillsDir, { recursive: true });

      const skillDir = join(skillsDir, `${namespace}-${name}`);
      await rm(skillDir, { recursive: true, force: true });
      await mkdir(skillDir, { recursive: true });

      const tempPath = join(skillDir, 'temp.tgz');
      const writeStream = createWriteStream(tempPath);
      await writeStream.write(Buffer.from(tarball));
      writeStream.end();
      await new Promise<void>((resolve) => writeStream.on('finish', resolve));

      const readStream = createReadStream(tempPath);
      await pipeline(readStream, createGunzip(), extract({ cwd: skillDir }));
      await unlink(tempPath);

      printNote('installed to', skillDir);
    }

    logSuccess(`Installed ${namespace}/${name}@${versionToInstall}`);
    printNote('targets', describeInstallTargets(options));
  } catch (e) {
    exitWithError(`Install failed: ${(e as Error).message}`);
  }
}
