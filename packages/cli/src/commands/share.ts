import { getClient } from '../api/client.js';
import { createInterface } from 'node:readline';
import { readSkillContent, resolveSkillLocation } from '../utils/skill-file.js';
import { publishLocalSkill } from './publish.js';
import { isKnownTool, discoverSkills, getToolLabel, resolveToolName } from '../tool-dirs.js';
import { pickSkills } from '../utils/picker.js';
import { blankLine, exitWithError, isJsonOutput, logError, logInfo, logSuccess, printJson, printNote, printPrimary, printSection, printUsage } from '../utils/output.js';
import { validateSkillContent } from '../manifest.js';

interface ShareOptions {
  oneTime?: boolean;
  expires?: string;
  uses?: number;
  password?: boolean;
  qr?: boolean;
  yes?: boolean;
  listed?: boolean;
  unlisted?: boolean;
}

interface PreflightShareResult {
  skill: Awaited<ReturnType<typeof discoverSkills>>[number];
  valid: boolean;
  error?: string;
}

interface BulkShareSuccess {
  name: string;
  token: string;
  url: string;
  namespace: string;
  manifestName: string;
  warnings: string[];
}

async function preflightShareSkills(
  skills: Awaited<ReturnType<typeof discoverSkills>>
): Promise<PreflightShareResult[]> {
  return Promise.all(
    skills.map(async (skill) => {
      try {
        const { skillFile, content } = await readSkillContent(skill.path);
        const validation = validateSkillContent(content);
        if (!validation.valid) {
          const error = validation.errors.map((item) => `${item.field}: ${item.message}`).join('; ');
          return {
            skill,
            valid: false,
            error: `${skillFile} is invalid${error ? ` (${error})` : ''}`,
          };
        }

        return { skill, valid: true };
      } catch (error) {
        return {
          skill,
          valid: false,
          error: (error as Error).message,
        };
      }
    })
  );
}

function parseSkillRef(skill: string): { namespace: string; name: string } {
  const parts = skill.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid skill reference. Use format: namespace/name');
  }
  return { namespace: parts[0], name: parts[1] };
}

export function parseShareToken(source: string): string | null {
  const match = source.match(/\/s\/([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

export function parsePackToken(source: string): string | null {
  const match = source.match(/\/p\/([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
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
  options: ShareOptions = {}
): Promise<void> {
  if (isKnownTool(skill)) {
    await bulkShareCommand(resolveToolName(skill) || skill, options);
    return;
  }

  if (!skill) {
    printUsage([
      'Usage: skilo share <path|namespace/name> [--one-time] [--expires 1h] [--uses 5] [--password]',
    ]);
  }

  try {
    const target = await resolveShareTarget(skill, {
      listed: options.listed,
      unlisted: options.unlisted ?? !options.listed,
    });
    const client = await getClient();

    // Parse expires
    let expiresAt: number | undefined;
    if (options.expires) {
      const match = options.expires.match(/^(\d+)(h|d|m)$/);
      if (!match) {
        exitWithError('Invalid expires format. Use 1h, 2d, or 30m.');
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
      logSuccess(`Published @${target.namespace}/${target.name}@${target.publishedVersion}`);
      printNote('visibility', options.listed ? 'public' : 'unlisted');
    }

    logSuccess(`Share link ready for ${target.namespace}/${target.name}`);
    if (isJsonOutput()) {
      printJson({
        command: 'share',
        skill: `${target.namespace}/${target.name}`,
        version: target.publishedVersion || null,
        trust: target.trust || null,
        token: result.token,
        url: result.url,
        oneTime: options.oneTime || false,
        expiresAt: expiresAt || null,
        maxUses: options.uses || null,
        passwordProtected: Boolean(options.password),
      });
      return;
    }

    printPrimary(result.url);
    if (options.oneTime) printNote('mode', 'one-time');
    if (expiresAt) printNote('expires', new Date(expiresAt).toISOString());
    if (options.uses) printNote('max uses', String(options.uses));
    if (options.password) printNote('password', 'required');

    if (options.qr && process.stdout.isTTY) {
      blankLine();
      printSection('Scan to install');
      printPrimary(generateQRCode(result.url));
    }
  } catch (e) {
    exitWithError((e as Error).message);
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
  options: ShareOptions
): Promise<void> {
  const resolvedToolName = resolveToolName(toolName) || 'all';
  const toolLabel = getToolLabel(resolvedToolName);
  logInfo(`Scanning ${toolLabel} for skills`);

  const skills = await discoverSkills(toolName);
  if (skills.length === 0) {
    logInfo('No skills found.');
    return;
  }

  logSuccess(`Found ${skills.length} skill${skills.length === 1 ? '' : 's'}`);

  let selected;
  if (options.yes) {
    selected = skills;
  } else {
    const result = await pickSkills(skills, `Select skills to share from ${toolLabel}`);
    if (result.cancelled || result.selected.length === 0) {
      logInfo('No skills selected.');
      return;
    }
    selected = result.selected;
  }

  // Parse expires
  let expiresAt: number | undefined;
  if (options.expires) {
    const match = options.expires.match(/^(\d+)(h|d|m)$/);
    if (!match) {
      exitWithError('Invalid expires format. Use 1h, 2d, or 30m.');
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
  const preflight = await preflightShareSkills(selected);
  const ready = preflight.filter((result) => result.valid).map((result) => result.skill);
  const failures: { name: string; error: string }[] = preflight
    .filter((result): result is PreflightShareResult & { valid: false; error: string } => !result.valid && Boolean(result.error))
    .map((result) => ({ name: result.skill.name, error: result.error! }));

  if (ready.length === 0) {
    if (isJsonOutput()) {
      printJson({
        command: 'share',
        mode: 'bulk',
        tool: toolName,
        pack: null,
        successes: [],
        failures,
        warnings: [],
      });
      return;
    }

    blankLine();
    printSection(`Skipped or failed (${failures.length})`);
    for (const failure of failures) {
      logError(`${failure.name}: ${failure.error}`);
    }
    return;
  }

  const total = ready.length;

  blankLine();
  if (failures.length > 0) {
    logInfo(`Preflight checked ${selected.length} skill${selected.length === 1 ? '' : 's'}`);
    logInfo(`${ready.length} ready, ${failures.length} skipped before publish`);
    blankLine();
  }
  logInfo(`Publishing ${total} skill${total === 1 ? '' : 's'}`);

  const successes: BulkShareSuccess[] = [];

  for (let i = 0; i < total; i++) {
    const skill = ready[i];
    logInfo(`[${i + 1}/${total}] ${skill.name}`);

    try {
      const { manifest, namespace, trust } = await publishLocalSkill(skill.path, {
        listed: options.listed,
        unlisted: options.unlisted ?? !options.listed,
        quiet: true,
        suppressTrustSummary: true,
      });
      const result = await client.createShareLink(
        namespace,
        manifest.name,
        options.oneTime || false,
        expiresAt,
        options.uses,
        password
      );
      logSuccess(`Shared ${namespace}/${manifest.name}`);
      successes.push({
        name: skill.name,
        token: result.token,
        url: result.url,
        namespace,
        manifestName: manifest.name,
        warnings: trust?.auditStatus === 'warning'
          ? [...new Set((trust.riskSummary || []).filter(Boolean))]
          : [],
      });
    } catch (e) {
      logError(`${skill.name}: ${(e as Error).message}`);
      failures.push({ name: skill.name, error: (e as Error).message });
    }
  }

  let packResult: { token: string; url: string; count: number } | null = null;

  if (successes.length >= 2) {
    try {
      const tokens = successes.map((s) => s.token);
      packResult = await client.createPack(toolName, tokens);
      blankLine();
      logSuccess(`Pack ready with ${packResult.count} skills`);
      if (isJsonOutput()) {
        printJson({
          command: 'share',
          mode: 'bulk',
          tool: toolName,
          pack: packResult,
          successes,
          failures,
          warnings: successes
            .filter((success) => success.warnings.length > 0)
            .map((success) => ({ name: success.name, warnings: success.warnings })),
        });
        return;
      }
    } catch (e) {
      logError(`Pack creation failed: ${(e as Error).message}`);
    }
  }

  if (isJsonOutput()) {
    printJson({
      command: 'share',
      mode: 'bulk',
      tool: toolName,
      pack: null,
      successes,
      failures,
      warnings: successes
        .filter((success) => success.warnings.length > 0)
        .map((success) => ({ name: success.name, warnings: success.warnings })),
    });
    return;
  }

  const warned = successes.filter((success) => success.warnings.length > 0);

  const reportLines: string[] = [];
  if (packResult) {
    reportLines.push('Pack', packResult.url, '');
  }
  reportLines.push('Summary');
  reportLines.push(`selected: ${selected.length}`);
  reportLines.push(`shared: ${successes.length}`);
  if (warned.length > 0) {
    reportLines.push(`warning-only: ${warned.length}`);
  }
  if (failures.length > 0) {
    reportLines.push(`failed: ${failures.length}`);
  }

  if (successes.length > 0) {
    reportLines.push('', 'Individual links');
    const maxNameLen = Math.max(...successes.map((success) => success.name.length));
    for (const success of successes) {
      reportLines.push(
        process.stdout.isTTY
          ? `${success.name.padEnd(maxNameLen)}  ${success.url}`
          : `${success.name}\t${success.url}`
      );
    }
  }

  if (warned.length > 0) {
    reportLines.push('', `Warnings (${warned.length})`);
    for (const success of warned) {
      reportLines.push(success.name);
      for (const warning of success.warnings) {
        reportLines.push(`risk: ${warning}`);
      }
    }
  }

  blankLine();
  printPrimary(reportLines.join('\n'));

  if (failures.length > 0) {
    blankLine();
    printSection(`Skipped or failed (${failures.length})`);
    for (const f of failures) {
      logError(`${f.name}: ${f.error}`);
    }
  }
}

async function resolveShareTarget(
  skill: string,
  options: { listed?: boolean; unlisted?: boolean } = {}
): Promise<{
  namespace: string;
  name: string;
  publishedVersion?: string;
  trust?: {
    publisherStatus: 'anonymous' | 'claimed' | 'verified';
    verified: boolean;
    hasSignature: boolean;
    visibility: 'public' | 'unlisted';
    auditStatus: 'clean' | 'warning' | 'blocked';
    capabilities: string[];
    riskSummary: string[];
    findings: Array<{ code: string; severity: 'info' | 'warning' | 'blocked'; message: string }>;
    sourceType: 'registry' | 'share' | 'local' | 'github' | 'pack' | 'derived_pack';
    integrity: { checksum: string; hasSignature: boolean; signatureVerified: boolean };
  };
}> {
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

  const { manifest, namespace, trust } = await publishLocalSkill(skill, {
    listed: options.listed,
    unlisted: options.unlisted ?? !options.listed,
  });
  return {
    namespace,
    name: manifest.name,
    publishedVersion: manifest.version || '0.1.0',
    trust,
  };
}

export async function ensureShareLinkForSource(
  source: string,
  options: { oneTime?: boolean; expires?: string; uses?: number; password?: boolean; listed?: boolean; unlisted?: boolean } = {}
): Promise<{ token: string; url: string; namespace?: string; name?: string; created: boolean }> {
  const existingShareToken = parseShareToken(source);
  if (existingShareToken) {
    return {
      token: existingShareToken,
      url: source.startsWith('http') ? source : `https://${source}`,
      created: false,
    };
  }

  const client = await getClient();
  const packToken = parsePackToken(source);
  if (packToken) {
    const pack = await client.resolvePack(packToken);
    throw new Error(
      `Pack links cannot be nested directly. Use the contained skills instead: ${pack.skills.map((skill) => skill.url).join(', ')}`
    );
  }

  let expiresAt: number | undefined;
  if (options.expires) {
    const match = options.expires.match(/^(\d+)(h|d|m)$/);
    if (!match) {
      exitWithError('Invalid expires format. Use 1h, 2d, or 30m.');
    }
    const value = parseInt(match[1]);
    const unit = match[2];
    const now = Date.now();
    if (unit === 'h') expiresAt = now + value * 60 * 60 * 1000;
    else if (unit === 'd') expiresAt = now + value * 24 * 60 * 60 * 1000;
    else if (unit === 'm') expiresAt = now + value * 60 * 1000;
  }

  let password: string | undefined;
  if (options.password) {
    password = await promptPassword();
  }

  const target = await resolveShareTarget(source, {
    listed: options.listed,
    unlisted: options.unlisted,
  });
  const result = await client.createShareLink(
    target.namespace,
    target.name,
    options.oneTime || false,
    expiresAt,
    options.uses,
    password
  );

  return {
    token: result.token,
    url: result.url,
    namespace: target.namespace,
    name: target.name,
    created: true,
  };
}
