import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getClient } from '../api/client.js';

const SKILLS_DIR = '.claude/skills';
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

export async function syncCommand(options: { force?: boolean } = {}): Promise<void> {
  const cwd = process.cwd();
  const skillsDir = join(cwd, SKILLS_DIR);
  const lockPath = join(cwd, SKILO_LOCK);

  try {
    const entries = await readdir(skillsDir);
    let updated = 0;
    let current = 0;

    // Check for lockfile
    let lockfile: Lockfile | null = null;
    try {
      const lockContent = await readFile(lockPath, 'utf-8');
      lockfile = JSON.parse(lockContent);
    } catch {
      console.log('No lockfile. Run "skilo lock" first for deterministic installs.');
    }

    console.log('Syncing skills...\n');

    for (const entry of entries) {
      const skillPath = join(skillsDir, entry);
      const st = await stat(skillPath);

      if (st.isDirectory()) {
        current++;
        const needsUpdate = await checkForUpdate(skillPath, entry, lockfile, options.force);

        if (needsUpdate) {
          updated++;
        }
      }
    }

    // Update lockfile
    if (updated > 0) {
      console.log('\nUpdating lockfile...');
      const newLock = await generateLockfile(skillsDir);
      await writeFile(lockPath, JSON.stringify(newLock, null, 2), 'utf-8');
      console.log(`✓ Updated ${SKILO_LOCK}`);
    }

    console.log(`\nSynced ${current} skills (${updated} updated)`);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

async function checkForUpdate(
  skillPath: string,
  name: string,
  lockfile: Lockfile | null,
  force: boolean = false
): Promise<boolean> {
  const skillMdPath = join(skillPath, 'SKILL.md');

  try {
    const content = await readFile(skillMdPath, 'utf-8');
    const nameMatch = content.match(/name:\s*(.+)/);
    const versionMatch = content.match(/version:\s*(.+)/);

    const skillName = nameMatch ? nameMatch[1].trim() : name;
    const localVersion = versionMatch ? versionMatch[1].trim() : '0.0.0';

    // Check lockfile version
    if (lockfile?.skills[skillName]) {
      const lockedVersion = lockfile.skills[skillName].version;

      if (force || localVersion !== lockedVersion) {
        console.log(`→ ${skillName}: ${lockedVersion} → ${localVersion}`);
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

async function generateLockfile(skillsDir: string): Promise<Lockfile> {
  const entries = await readdir(skillsDir);
  const lockfile: Lockfile = { version: '1', skills: {} };

  for (const entry of entries) {
    const skillPath = join(skillsDir, entry);
    const st = await stat(skillPath);

    if (st.isDirectory()) {
      const skillMdPath = join(skillPath, 'SKILL.md');
      try {
        const content = await readFile(skillMdPath, 'utf-8');
        const nameMatch = content.match(/name:\s*(.+)/);
        const versionMatch = content.match(/version:\s*(.+)/);

        const name = nameMatch ? nameMatch[1].trim() : entry;
        const version = versionMatch ? versionMatch[1].trim() : '0.0.0';
        const resolved = `skilo://${entry}`;

        lockfile.skills[name] = { version, resolved, checksum: '' };
      } catch {
        // Skip
      }
    }
  }

  return lockfile;
}