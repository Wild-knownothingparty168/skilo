import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import * as crypto from 'node:crypto';

const SKILLS_DIR = '.claude/skills';

export async function auditCommand(): Promise<void> {
  const skillsDir = join(process.cwd(), SKILLS_DIR);

  console.log('Auditing installed skills...\n');

  try {
    const entries = await readdir(skillsDir);
    let total = 0;
    let issues = 0;

    for (const entry of entries) {
      const skillPath = join(skillsDir, entry);
      const st = await stat(skillPath);

      if (st.isDirectory()) {
        total++;
        const result = await auditSkill(skillPath, entry);
        if (!result.secure) issues++;
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Total skills: ${total}`);
    console.log(`Issues found: ${issues}`);

    if (issues > 0) {
      console.log('\nRun "skilo cat <skill>" to inspect individual skills');
      process.exit(1);
    }
  } catch (e) {
    console.log('No skills installed');
  }
}

async function auditSkill(skillPath: string, name: string): Promise<{ secure: boolean }> {
  let secure = true;

  // Check for SKILL.md
  const skillMdPath = join(skillPath, 'SKILL.md');
  try {
    const content = await readFile(skillMdPath, 'utf-8');

    // Check for suspicious patterns in SKILL.md
    const suspicious = [
      { pattern: /eval\s*\(/, msg: 'Contains eval()' },
      { pattern: /child_process/, msg: 'References child_process' },
      { pattern: /exec\s*\(/, msg: 'Contains exec()' },
      { pattern: /shell:\s*true/, msg: 'Enables shell execution' },
      { pattern: /dangerouslySetInnerHTML/, msg: 'Uses dangerouslySetInnerHTML' },
    ];

    for (const check of suspicious) {
      if (check.pattern.test(content)) {
        console.log(`⚠ ${name}: ${check.msg}`);
        secure = false;
      }
    }

    // Check for executable files
    const files = await readdir(skillPath);
    const dangerous = ['index.sh', 'install.sh', 'setup.sh', 'run.sh'];
    for (const file of files) {
      if (dangerous.includes(file.toLowerCase())) {
        console.log(`⚠ ${name}: Contains executable script "${file}"`);
        secure = false;
      }
    }

    // Check for npm/yarn/pnpm which could run scripts
    const packageJsonPath = join(skillPath, 'package.json');
    try {
      const pkg = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
        console.log(`⚠ ${name}: package.json has scripts (could execute on install)`);
        // Not necessarily insecure, just worth noting
      }
    } catch {
      // No package.json, that's fine
    }

    if (secure) {
      console.log(`✓ ${name}`);
    }
  } catch {
    console.log(`✗ ${name}: Missing SKILL.md`);
    secure = false;
  }

  return { secure };
}