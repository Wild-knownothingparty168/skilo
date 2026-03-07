import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import * as crypto from 'node:crypto';

const SKILO_LOCK = 'skilo.lock.json';

interface Lockfile {
  version: '1';
  skills: Record<string, SkillLock>;
}

interface SkillLock {
  version: string;
  resolved: string;
  checksum: string;
}

export async function lockCommand(): Promise<void> {
  const skillsDir = join(process.cwd(), '.claude', 'skills');

  try {
    const entries = await readdir(skillsDir);
    const lockfile: Lockfile = { version: '1', skills: {} };

    for (const entry of entries) {
      const skillPath = join(skillsDir, entry);
      const st = await stat(skillPath);

      if (st.isDirectory()) {
        // Try to find SKILL.md for version info
        try {
          const skillMdPath = join(skillPath, 'SKILL.md');
          const content = await readFile(skillMdPath, 'utf-8');

          const versionMatch = content.match(/version:\s*(.+)/);
          const nameMatch = content.match(/name:\s*(.+)/);

          const name = nameMatch ? nameMatch[1].trim() : entry;
          const version = versionMatch ? versionMatch[1].trim() : '0.0.0';

          // Generate deterministic ID
          const resolved = `skilo://${entry}`;
          const checksum = crypto.createHash('sha256').update(content).digest('hex');

          lockfile.skills[name] = { version, resolved, checksum: checksum.slice(0, 16) };
        } catch {
          // Skip dirs without SKILL.md
        }
      }
    }

    await writeFile(SKILO_LOCK, JSON.stringify(lockfile, null, 2), 'utf-8');
    console.log(`✓ Created ${SKILO_LOCK}`);
    console.log(`  ${Object.keys(lockfile.skills).length} skills locked`);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

export async function verifyLockCommand(): Promise<void> {
  const lockPath = join(process.cwd(), SKILO_LOCK);
  const skillsDir = join(process.cwd(), '.claude', 'skills');

  try {
    const lockContent = await readFile(lockPath, 'utf-8');
    const lockfile: Lockfile = JSON.parse(lockContent);

    console.log('Verifying lockfile...\n');

    let errors = 0;
    for (const [name, skill] of Object.entries(lockfile.skills)) {
      const skillDir = join(skillsDir, name.replace('/', '-'));
      const skillMdPath = join(skillDir, 'SKILL.md');

      try {
        const content = await readFile(skillMdPath, 'utf-8');
        const checksum = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

        if (checksum !== skill.checksum) {
          console.log(`✗ ${name}: checksum mismatch`);
          errors++;
        } else {
          console.log(`✓ ${name}@${skill.version}`);
        }
      } catch {
        console.log(`✗ ${name}: not found`);
        errors++;
      }
    }

    if (errors > 0) {
      console.log(`\n${errors} verification failed. Run 'skilo lock' to update.`);
      process.exit(1);
    }
    console.log('\n✓ All checksums verified');
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}