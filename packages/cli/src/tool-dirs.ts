import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { findSkillFile } from './utils/skill-file.js';

export interface DiscoveredSkill {
  name: string;
  description: string;
  path: string;       // absolute path to skill directory
  tool: string;       // which tool it came from
}

export const TOOL_MAP: Record<string, string[]> = {
  claude: ['~/.claude/skills/'],
  codex: ['~/.agents/skills/', '~/.codex/skills/'],
  opencode: ['~/.config/opencode/skills/'],
  openclaw: ['~/.openclaw/skills/'],
  cursor: ['~/.cursor/skills/'],
  amp: ['~/.config/agents/skills/'],
  windsurf: ['~/.codeium/windsurf/skills/'],
  cline: ['~/.cline/skills/'],
  roo: ['~/.roo/skills/'],
};

export type ToolName = keyof typeof TOOL_MAP;
export type ToolSourceName = ToolName | 'all';

const TOOL_LABELS: Record<ToolName, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  opencode: 'OpenCode',
  openclaw: 'OpenClaw',
  cursor: 'Cursor',
  amp: 'Amp',
  windsurf: 'Windsurf',
  cline: 'Cline',
  roo: 'Roo',
};

const TOOL_ALIASES: Record<string, ToolName> = {
  claude: 'claude',
  cc: 'claude',
  'claude-code': 'claude',
  codex: 'codex',
  cursor: 'cursor',
  amp: 'amp',
  windsurf: 'windsurf',
  oc: 'opencode',
  opencode: 'opencode',
  cline: 'cline',
  roo: 'roo',
  openclaw: 'openclaw',
};

export function resolveToolName(name: string): ToolSourceName | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === 'all') {
    return 'all';
  }

  return TOOL_ALIASES[normalized] || null;
}

export function getToolLabel(name: ToolSourceName): string {
  if (name === 'all') {
    return 'All supported tools';
  }

  return TOOL_LABELS[name];
}

export function isKnownTool(name: string): boolean {
  return resolveToolName(name) !== null;
}

function parseFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result: { name?: string; description?: string } = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (key === 'name') result.name = value;
      if (key === 'description') result.description = value;
    }
  }
  return result;
}

export async function discoverSkills(toolName: ToolSourceName): Promise<DiscoveredSkill[]> {
  const tools = toolName === 'all'
    ? Object.entries(TOOL_MAP)
    : [[toolName, TOOL_MAP[toolName]] as [string, string[]]];

  const seen = new Set<string>();
  const skills: DiscoveredSkill[] = [];

  for (const [tool, dirs] of tools) {
    for (const dir of dirs) {
      const resolved = dir.replace(/^~/, homedir());
      let entries: string[];
      try {
        const dirents = await readdir(resolved, { withFileTypes: true });
        entries = dirents
          .filter((d) => d.isDirectory())
          .map((d) => d.name);
      } catch {
        continue;
      }

      for (const entry of entries) {
        const skillDir = join(resolved, entry);
        const skillFileName = await findSkillFile(skillDir);
        if (!skillFileName) continue;

        const content = await readFile(join(skillDir, skillFileName), 'utf-8');
        const fm = parseFrontmatter(content);
        const name = fm.name || entry;

        if (seen.has(name)) continue;
        seen.add(name);

        skills.push({
          name,
          description: fm.description || '',
          path: skillDir,
          tool,
        });
      }
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}
