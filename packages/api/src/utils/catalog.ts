import type { Env } from '../index.js';
import { buildTrustInfo, parseVersionMetadata, type TrustInfo } from './trust.js';

export type CatalogSourceKind = 'skilo' | 'github' | 'skills_sh' | 'snapshot';

export interface CatalogEntry {
  id: string;
  sourceKind: CatalogSourceKind;
  canonicalRef: string;
  installRef: string;
  owner: string;
  name: string;
  description: string;
  homepage: string | null;
  repository: string | null;
  pageUrl: string | null;
  trust: TrustInfo | null;
}

type NativeSkillRow = {
  id: string;
  name: string;
  namespace: string;
  description: string;
  latest_version: string;
  privacy: string;
  metadata_json: string | null;
  signature: string | null;
  checksumsha256: string | null;
};

type ShareSkillRow = NativeSkillRow & {
  token: string;
};

const SKILLS_SH_CACHE_KEY = 'catalog:skills_sh:v1';
const SKILLS_SH_URL = 'https://skills.sh';

function skillPathName(input: string): string {
  return input.split('/').pop() || input;
}

function humanizeSkillName(name: string): string {
  return name.replace(/[-_]+/g, ' ').trim();
}

function buildExternalTrust(sourceKind: CatalogSourceKind): TrustInfo {
  return {
    publisherStatus: 'anonymous',
    verified: false,
    hasSignature: false,
    visibility: 'public',
    auditStatus: 'clean',
    capabilities: [],
    riskSummary: [],
    findings: [],
    sourceType: sourceKind === 'snapshot' ? 'pack' : 'github',
    integrity: {
      checksum: '',
      hasSignature: false,
      signatureVerified: false,
    },
  };
}

function toNativeCatalogEntry(row: NativeSkillRow): CatalogEntry {
  const metadata = parseVersionMetadata(row.metadata_json);
  return {
    id: `skilo:${row.namespace}/${row.name}`,
    sourceKind: 'skilo',
    canonicalRef: `${row.namespace}/${row.name}`,
    installRef: `${row.namespace}/${row.name}`,
    owner: row.namespace,
    name: row.name,
    description: row.description || metadata.audit.riskSummary[0] || '',
    homepage: metadata.homepage,
    repository: metadata.repository,
    pageUrl: null,
    trust: buildTrustInfo({
      signature: row.signature,
      privacy: row.privacy,
      checksum: row.checksumsha256,
      metadataJson: row.metadata_json,
    }),
  };
}

function toShareCatalogEntry(row: ShareSkillRow): CatalogEntry {
  const metadata = parseVersionMetadata(row.metadata_json);
  return {
    id: `share:${row.token}`,
    sourceKind: 'skilo',
    canonicalRef: `https://skilo.xyz/s/${row.token}`,
    installRef: `https://skilo.xyz/s/${row.token}`,
    owner: row.namespace,
    name: row.name,
    description: row.description || metadata.audit.riskSummary[0] || '',
    homepage: metadata.homepage,
    repository: metadata.repository,
    pageUrl: `https://skilo.xyz/s/${row.token}`,
    trust: buildTrustInfo({
      signature: row.signature,
      privacy: row.privacy,
      checksum: row.checksumsha256,
      metadataJson: row.metadata_json,
      sourceType: 'share',
    }),
  };
}

function parseRepoShorthand(input: string): { owner: string; repo: string; skill: string } | null {
  const match = input.trim().match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)@([A-Za-z0-9_.-]+)$/);
  if (!match) {
    return null;
  }

  return { owner: match[1], repo: match[2], skill: match[3] };
}

function parseRepoPathShorthand(input: string): { owner: string; repo: string; path: string; skill: string } | null {
  const match = input.trim().match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+):(.+)$/);
  if (!match) {
    return null;
  }

  const path = match[3].replace(/^\/+|\/+$/g, '');
  if (!path) {
    return null;
  }

  const lastSegment = path.split('/').filter(Boolean).pop();
  if (!lastSegment) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
    path,
    skill: lastSegment.replace(/\.md$/i, ''),
  };
}

function parseSkillsShUrl(input: string): { owner: string; repo: string; skill: string } | null {
  const match = input.trim().match(/^https?:\/\/skills\.sh\/([^/]+)\/([^/]+)\/([^/?#]+)\/?$/i);
  if (!match) {
    return null;
  }

  return { owner: match[1], repo: match[2], skill: match[3] };
}

function parseGitHubUrl(input: string): { owner: string; repo: string; skill: string; rawRef: string } | null {
  const normalized = input.trim();
  const treeSkill = normalized.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/[^/]+\/(?:.+\/)?skills\/([^/?#]+)\/?$/i);
  if (treeSkill) {
    return {
      owner: treeSkill[1],
      repo: treeSkill[2].replace(/\.git$/i, ''),
      skill: treeSkill[3],
      rawRef: normalized,
    };
  }

  return null;
}

function toExternalCatalogEntry(input: {
  sourceKind: 'github' | 'skills_sh';
  owner: string;
  repo: string;
  skill: string;
}): CatalogEntry {
  const installRef = `${input.owner}/${input.repo}@${input.skill}`;
  const pageUrl = input.sourceKind === 'skills_sh'
    ? `${SKILLS_SH_URL}/${input.owner}/${input.repo}/${input.skill}`
    : `https://github.com/${input.owner}/${input.repo}/tree/main/skills/${input.skill}`;

  return {
    id: `${input.sourceKind}:${installRef}`,
    sourceKind: input.sourceKind,
    canonicalRef: installRef,
    installRef,
    owner: `${input.owner}/${input.repo}`,
    name: input.skill,
    description: `Public skill discovered from ${input.sourceKind === 'skills_sh' ? 'skills.sh' : 'GitHub'}.`,
    homepage: null,
    repository: `https://github.com/${input.owner}/${input.repo}`,
    pageUrl,
    trust: buildExternalTrust(input.sourceKind),
  };
}

async function fetchSkillsShCatalog(env: Env): Promise<CatalogEntry[]> {
  const cached = await env.SKILLPACK_KV.get(SKILLS_SH_CACHE_KEY, { type: 'json' }) as CatalogEntry[] | null;
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  const response = await fetch(SKILLS_SH_URL);
  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const seen = new Set<string>();
  const entries: CatalogEntry[] = [];
  const regex = /href="\/([^/"?#]+)\/([^/"?#]+)\/([^/"?#]+)"/g;

  for (const match of html.matchAll(regex)) {
    const owner = match[1];
    const repo = match[2];
    const skill = match[3];
    const ref = `${owner}/${repo}@${skill}`;

    if (seen.has(ref) || owner.startsWith('_') || repo.startsWith('_')) {
      continue;
    }

    seen.add(ref);
    entries.push(toExternalCatalogEntry({ sourceKind: 'skills_sh', owner, repo, skill }));
    if (entries.length >= 48) {
      break;
    }
  }

  await env.SKILLPACK_KV.put(SKILLS_SH_CACHE_KEY, JSON.stringify(entries), { expirationTtl: 900 });
  return entries;
}

async function queryNativeSkills(env: Env, query: string, limit: number): Promise<CatalogEntry[]> {
  const q = query.trim();
  let rows;

  if (q) {
    rows = await env.DB.prepare(
      `SELECT s.id, s.name, s.namespace, s.description, s.latest_version, s.privacy,
              sv.metadata_json, sv.signature, sv.checksumsha256
       FROM skills s
       JOIN skills_fts fts ON s.rowid = fts.rowid
       LEFT JOIN skill_versions sv ON s.id = sv.skill_id AND sv.version = s.latest_version
       WHERE skills_fts MATCH ? AND s.privacy = 'public'
       ORDER BY rank
       LIMIT ?`
    ).bind(q, limit).all<NativeSkillRow>();
  } else {
    rows = await env.DB.prepare(
      `SELECT s.id, s.name, s.namespace, s.description, s.latest_version, s.privacy,
              sv.metadata_json, sv.signature, sv.checksumsha256
       FROM skills s
       LEFT JOIN skill_versions sv ON s.id = sv.skill_id AND sv.version = s.latest_version
       WHERE s.privacy = 'public'
       ORDER BY s.updated_at DESC
       LIMIT ?`
    ).bind(limit).all<NativeSkillRow>();
  }

  return (rows.results || []).map(toNativeCatalogEntry);
}

export async function searchCatalog(env: Env, query: string, limit: number): Promise<CatalogEntry[]> {
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const [nativeEntries, externalEntries] = await Promise.all([
    queryNativeSkills(env, query, safeLimit),
    fetchSkillsShCatalog(env),
  ]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredExternal = normalizedQuery
    ? externalEntries.filter((entry) =>
        [entry.name, entry.owner, entry.canonicalRef, humanizeSkillName(entry.name)]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
    : externalEntries;

  return [...nativeEntries, ...filteredExternal].slice(0, safeLimit);
}

async function resolveNativeSkill(env: Env, namespace: string, name: string): Promise<CatalogEntry | null> {
  const row = await env.DB.prepare(
    `SELECT s.id, s.name, s.namespace, s.description, s.latest_version, s.privacy,
            sv.metadata_json, sv.signature, sv.checksumsha256
     FROM skills s
     LEFT JOIN skill_versions sv ON s.id = sv.skill_id AND sv.version = s.latest_version
     WHERE s.namespace = ? AND s.name = ?
     LIMIT 1`
  ).bind(namespace, name).first<NativeSkillRow>();

  return row ? toNativeCatalogEntry(row) : null;
}

async function resolveShareSkill(env: Env, token: string): Promise<CatalogEntry | null> {
  const row = await env.DB.prepare(
    `SELECT sl.token, s.id, s.name, s.namespace, s.description, s.latest_version, s.privacy,
            sv.metadata_json, sv.signature, sv.checksumsha256
     FROM share_links sl
     JOIN skills s ON sl.skill_id = s.id
     LEFT JOIN skill_versions sv ON s.id = sv.skill_id AND sv.version = s.latest_version
     WHERE sl.token = ?
     LIMIT 1`
  ).bind(token).first<ShareSkillRow>();

  return row ? toShareCatalogEntry(row) : null;
}

export async function resolveCatalogEntry(env: Env, input: string): Promise<CatalogEntry | null> {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const shareMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?skilo\.xyz\/s\/([A-Za-z0-9_-]+)/i);
  if (shareMatch) {
    return resolveShareSkill(env, shareMatch[1]);
  }

  const nativeMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (nativeMatch) {
    const native = await resolveNativeSkill(env, nativeMatch[1], nativeMatch[2]);
    if (native) {
      return native;
    }
  }

  const skillsShMatch = parseSkillsShUrl(trimmed);
  if (skillsShMatch) {
    return toExternalCatalogEntry({ sourceKind: 'skills_sh', ...skillsShMatch });
  }

  const shorthand = parseRepoShorthand(trimmed);
  if (shorthand) {
    return toExternalCatalogEntry({ sourceKind: 'github', ...shorthand });
  }

  const repoPath = parseRepoPathShorthand(trimmed);
  if (repoPath) {
    return {
      id: `github:${repoPath.owner}/${repoPath.repo}:${repoPath.path}`,
      sourceKind: 'github',
      canonicalRef: `${repoPath.owner}/${repoPath.repo}:${repoPath.path}`,
      installRef: `${repoPath.owner}/${repoPath.repo}:${repoPath.path}`,
      owner: `${repoPath.owner}/${repoPath.repo}`,
      name: repoPath.skill,
      description: `Public GitHub skill source at ${repoPath.path}.`,
      homepage: null,
      repository: `https://github.com/${repoPath.owner}/${repoPath.repo}`,
      pageUrl: `https://github.com/${repoPath.owner}/${repoPath.repo}/tree/main/${repoPath.path}`,
      trust: buildExternalTrust('github'),
    };
  }

  const github = parseGitHubUrl(trimmed);
  if (github) {
    return toExternalCatalogEntry({
      sourceKind: 'github',
      owner: github.owner,
      repo: github.repo,
      skill: github.skill,
    });
  }

  return null;
}

export async function getPublicProfile(env: Env, username: string): Promise<{
  username: string;
  skills: CatalogEntry[];
  packs: never[];
} | null> {
  const user = await env.DB.prepare(
    `SELECT id, username FROM users WHERE username = ? LIMIT 1`
  ).bind(username).first<{ id: string; username: string }>();

  if (!user) {
    return null;
  }

  const rows = await env.DB.prepare(
    `SELECT s.id, s.name, s.namespace, s.description, s.latest_version, s.privacy,
            sv.metadata_json, sv.signature, sv.checksumsha256
     FROM skills s
     LEFT JOIN skill_versions sv ON s.id = sv.skill_id AND sv.version = s.latest_version
     WHERE s.namespace = ? AND s.privacy = 'public'
     ORDER BY s.updated_at DESC`
  ).bind(username).all<NativeSkillRow>();

  return {
    username: user.username,
    skills: (rows.results || []).map(toNativeCatalogEntry),
    packs: [],
  };
}

export function labelCatalogEntry(entry: CatalogEntry): string {
  return entry.sourceKind === 'skilo'
    ? `${entry.owner}/${entry.name}`
    : `${entry.owner}@${skillPathName(entry.name)}`;
}
