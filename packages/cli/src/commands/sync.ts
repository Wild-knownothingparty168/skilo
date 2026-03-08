import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InstallOptions, InstallTarget, InstallTargetResolution } from '../utils/install-targets.js';
import {
  describeInstallTargets,
  getExplicitInstallTargets,
  parseInstallTargetTokens,
} from '../utils/install-targets.js';
import { exitWithError, isJsonOutput, logInfo, logSuccess, logWarn, printJson } from '../utils/output.js';
import { getToolLabel, resolveToolName } from '../tool-dirs.js';
import { quoteShellValue, selectToolSourceSkills } from '../utils/tool-source.js';
import { installSkill } from './import.js';

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

interface SyncOptions extends InstallOptions {
  force?: boolean;
  source?: string;
  targets?: string[];
}

function emitToolSelectionNoop(
  source: string,
  sourceLabel: string,
  availableSkills: Array<{ name: string; tool: string }>,
  targetArgs: string[]
): void {
  const targetSuffix = targetArgs.length > 0 ? ` ${targetArgs.join(' ')}` : '';
  const firstSkill = availableSkills[0]?.name;
  const nextCommand = firstSkill
    ? `skilo sync ${source}${targetSuffix} --skill ${quoteShellValue(firstSkill)}`
    : `skilo sync ${source}${targetSuffix} --all`;

  if (isJsonOutput()) {
    printJson({
      command: 'sync',
      source,
      resolvedType: 'tool',
      skillCount: 0,
      availableSkills,
      installedTargets: [],
      nextCommand,
      message: `Multiple skills found in ${sourceLabel}. Pass --all, use --skill <name>, or run in a TTY.`,
    });
    return;
  }

  exitWithError(`Multiple skills found in ${sourceLabel}. Pass --all, use --skill <name>, or run in a TTY.`);
}

function getSyncTargets(sourceTool: string, targetArgs: string[], options: InstallOptions): InstallTarget[] {
  const positionalTargets = parseInstallTargetTokens(targetArgs);
  const explicitTargets = getExplicitInstallTargets(options);
  const combined = [...new Set([...positionalTargets, ...explicitTargets])];

  if (combined.length === 0) {
    exitWithError(`Missing sync target. Use "skilo sync ${sourceTool} opencode" or "skilo sync ${sourceTool} --oc".`);
  }

  const filtered = combined.filter((target) => target !== sourceTool);
  if (filtered.length !== combined.length) {
    logWarn(`Skipping source target ${sourceTool}; sync targets must be different from the source tool.`);
  }

  if (filtered.length === 0) {
    exitWithError('No valid sync targets remain after removing the source tool.');
  }

  return filtered;
}

async function syncTools(source: string, targetArgs: string[], options: SyncOptions): Promise<void> {
  const sourceTool = resolveToolName(source);
  if (!sourceTool || sourceTool === 'all') {
    exitWithError(`Unknown sync source "${source}". Use a supported tool like claude, codex, cursor, or opencode.`);
  }

  const targetTools = getSyncTargets(sourceTool, targetArgs, options);
  const targetResolution: InstallTargetResolution = {
    mode: 'explicit',
    targets: targetTools,
    detectedTargets: [],
  };

  const selection = await selectToolSourceSkills(source, options);
  if (selection.mode === 'needs_selection') {
    emitToolSelectionNoop(source, selection.sourceLabel, selection.availableSkills, targetArgs);
    return;
  }

  if (selection.mode === 'cancelled') {
    logInfo('No skills selected.');
    if (isJsonOutput()) {
      printJson({
        command: 'sync',
        source,
        sourceTool: selection.sourceTool,
        skillCount: 0,
        installedTargets: targetTools,
        cancelled: true,
      });
    }
    return;
  }

  logInfo(
    `Syncing ${selection.selectedSkills.length} skill${selection.selectedSkills.length === 1 ? '' : 's'} from ${selection.sourceLabel} to ${describeInstallTargets(targetTools)}`
  );

  const installResults = [];
  for (const selected of selection.selectedSkills) {
    logInfo(`Syncing ${selected.name}`);
    installResults.push(await installSkill(selected.path, options, targetResolution));
  }

  logSuccess(`Synced ${installResults.length} skill${installResults.length === 1 ? '' : 's'} from ${selection.sourceLabel}`);

  if (isJsonOutput()) {
    printJson({
      command: 'sync',
      source,
      resolvedType: 'tool',
      sourceTool: selection.sourceTool,
      sourceLabel: selection.sourceLabel,
      skillCount: installResults.length,
      installedTargets: targetTools,
      nextCommand: `skilo share ${source}${selection.selectionMode === 'all' ? ' -y' : ''}`,
      selectedSkills: selection.selectedSkills.map((skill) => ({
        name: skill.name,
        path: skill.path,
        tool: skill.tool,
      })),
      installedSkills: installResults.map((installResult) => ({
        name: installResult.name,
        targets: installResult.targets,
        installedDirs: installResult.installedDirs,
      })),
    });
  }
}

export async function syncCommand(options: SyncOptions = {}): Promise<void> {
  if (options.source) {
    await syncTools(options.source, options.targets || [], options);
    return;
  }

  const cwd = process.cwd();
  const skillsDir = join(cwd, SKILLS_DIR);
  const lockPath = join(cwd, SKILO_LOCK);

  try {
    const entries = await readdir(skillsDir);
    let updated = 0;
    let current = 0;

    let lockfile: Lockfile | null = null;
    try {
      const lockContent = await readFile(lockPath, 'utf-8');
      lockfile = JSON.parse(lockContent);
    } catch {
      logInfo('No lockfile. Run "skilo lock" first for deterministic installs.');
    }

    logInfo(`Syncing ${getToolLabel('claude')} project skills`);

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

    if (updated > 0) {
      logInfo(`Updating ${SKILO_LOCK}`);
      const newLock = await generateLockfile(skillsDir);
      await writeFile(lockPath, JSON.stringify(newLock, null, 2), 'utf-8');
      logSuccess(`Updated ${SKILO_LOCK}`);
    }

    logSuccess(`Synced ${current} skill${current === 1 ? '' : 's'} (${updated} updated)`);
  } catch (e) {
    exitWithError((e as Error).message);
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

    if (lockfile?.skills[skillName]) {
      const lockedVersion = lockfile.skills[skillName].version;

      if (force || localVersion !== lockedVersion) {
        logInfo(`${skillName}: ${lockedVersion} -> ${localVersion}`);
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
