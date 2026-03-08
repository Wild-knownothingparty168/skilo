// API client for skilo site
const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE = viteEnv?.VITE_API_BASE || 'https://skilo-api.yaz-b35.workers.dev';

export interface SkillMetadata {
  name: string;
  namespace: string;
  description: string;
  version: string;
  author: string | null;
  homepage: string | null;
  repository: string | null;
  keywords: string[];
  tarballUrl: string;
  contentUrl?: string;
  size: number;
  checksum: string;
  listed: boolean;
  verified: boolean;
  trust?: {
    publisherStatus: 'anonymous' | 'claimed' | 'verified';
    verified: boolean;
    hasSignature: boolean;
    visibility: 'public' | 'unlisted';
    auditStatus: 'clean' | 'warning' | 'blocked';
    capabilities: string[];
    riskSummary: string[];
    findings: Array<{
      code: string;
      severity: 'info' | 'warning' | 'blocked';
      message: string;
    }>;
    sourceType: 'registry' | 'share' | 'local' | 'github' | 'pack' | 'derived_pack';
    integrity: {
      checksum: string;
      hasSignature: boolean;
      signatureVerified: boolean;
    };
  };
  createdAt: number;
  updatedAt: number;
}

export interface CatalogEntry {
  id: string;
  sourceKind: 'skilo' | 'github' | 'skills_sh' | 'snapshot';
  canonicalRef: string;
  installRef: string;
  owner: string;
  name: string;
  description: string;
  homepage: string | null;
  repository: string | null;
  pageUrl: string | null;
  trust: SkillMetadata['trust'] | null;
}

export interface ShareLinkInfo {
  token: string;
  expiresAt?: number | null;
  oneTime: boolean;
  maxUses?: number | null;
  usesCount: number;
  passwordProtected: boolean;
}

export interface ShareLink {
  token: string;
  url: string;
  expiresAt?: number;
  oneTime: boolean;
  maxUses?: number;
  usesCount: number;
}

export interface PackSkill {
  namespace: string;
  name: string;
  description: string;
  version: string;
  shareToken: string;
  url: string;
  verified?: boolean;
  visibility?: 'public' | 'unlisted';
  trust?: SkillMetadata['trust'];
  installRef?: string;
  sourceKind?: 'skilo' | 'github' | 'skills_sh' | 'snapshot';
}

export interface PackData {
  name: string;
  token: string;
  skills: PackSkill[];
  trust?: SkillMetadata['trust'] & {
    memberCounts?: {
      clean: number;
      warning: number;
      blocked: number;
      verified: number;
    };
    highestRisk?: 'clean' | 'warning' | 'blocked';
    derived?: boolean;
    sourcePackToken?: string | null;
  };
  type?: 'native-pack' | 'ref-pack';
  refs?: string[];
  items?: Array<{
    ref: string;
    token: string;
    url: string;
    entry: CatalogEntry | null;
  }>;
}

export interface SiteStats {
  skills: number;
  installs: number;
}

export interface ProfileData {
  username: string;
  skills: CatalogEntry[];
  packs: Array<never>;
}

export const api = {
  async getStats(): Promise<SiteStats> {
    const res = await fetch(`${API_BASE}/v1/stats`);
    if (!res.ok) return { skills: 0, installs: 0 };
    return res.json();
  },

  async getSkill(namespace: string, name: string): Promise<SkillMetadata> {
    const res = await fetch(`${API_BASE}/v1/skills/${namespace}/${name}`);
    if (!res.ok) throw new Error('Skill not found');
    return res.json();
  },

  async resolveShare(token: string): Promise<
    | { type?: undefined; skill: SkillMetadata; link?: ShareLinkInfo; trust?: SkillMetadata['trust']; requiresPassword: boolean }
    | { type: 'ref-link'; ref: string; token: string }
  > {
    const res = await fetch(`${API_BASE}/v1/skills/share/${token}`);
    if (!res.ok) throw new Error('Invalid or expired share link');
    return res.json();
  },

  async resolvePack(token: string): Promise<PackData> {
    const res = await fetch(`${API_BASE}/v1/packs/${token}`);
    if (!res.ok) throw new Error('Pack not found');
    return res.json();
  },

  async getCatalog(query = '', limit = 24): Promise<{ query: string; total: number; entries: CatalogEntry[] }> {
    const url = new URL(`${API_BASE}/v2/catalog`);
    if (query) url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load catalog');
    return res.json();
  },

  async resolveSource(input: string): Promise<{ resolved: boolean; input: string; entry?: CatalogEntry }> {
    const res = await fetch(`${API_BASE}/v2/resolve-source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    if (!res.ok) throw new Error('Failed to resolve source');
    return res.json();
  },

  async createRefPack(refs: string[]): Promise<{ token: string; url: string; count: number; items?: Array<{ ref: string; token: string; url: string }> }> {
    const res = await fetch(`${API_BASE}/v1/packs/from-refs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refs }),
    });
    if (!res.ok) throw new Error('Pack creation failed');
    return res.json();
  },

  async getProfile(username: string): Promise<ProfileData> {
    const res = await fetch(`${API_BASE}/v2/profiles/${username}`);
    if (!res.ok) throw new Error('Profile not found');
    return res.json();
  },

  async subsetPack(source: string, keep: string[]): Promise<{ token: string; url: string; count: number }> {
    const res = await fetch(`${API_BASE}/v1/packs/subset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, keep }),
    });
    if (!res.ok) throw new Error('Failed to create pack subset');
    return res.json();
  },

  async fetchSkillContent(tarballUrl: string): Promise<string> {
    const url = tarballUrl.startsWith('http') ? tarballUrl : `${API_BASE}${tarballUrl}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch skill content');

    const decompressed = res.body!.pipeThrough(new DecompressionStream('gzip'));
    const reader = decompressed.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Parse tar: find SKILL.md or skill.md
    let pos = 0;
    const decoder = new TextDecoder();
    while (pos + 512 <= buffer.length) {
      const header = buffer.slice(pos, pos + 512);
      if (header.every((b) => b === 0)) break;

      const fileName = decoder.decode(header.slice(0, 100)).replace(/\0.*$/, '').trim();
      const sizeStr = decoder.decode(header.slice(124, 136)).replace(/\0.*$/, '').trim();
      const fileSize = parseInt(sizeStr, 8) || 0;

      pos += 512;
      if (/^(skill\.md|SKILL\.md)$/i.test(fileName.split('/').pop() || '')) {
        return decoder.decode(buffer.slice(pos, pos + fileSize));
      }
      pos += Math.ceil(fileSize / 512) * 512;
    }

    throw new Error('SKILL.md not found in tarball');
  },

  async fetchShareSkillContent(token: string, password?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/v1/skills/share/${token}/content`, {
      headers: password ? { 'X-Skilo-Share-Password': password } : undefined,
    });
    if (!res.ok) throw new Error('Failed to fetch skill content');
    return res.text();
  },

  async verifySharePassword(token: string, password: string): Promise<{ skill: SkillMetadata; link?: ShareLinkInfo; trust?: SkillMetadata['trust'] }> {
    const res = await fetch(`${API_BASE}/v1/skills/share/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('Invalid password');
    return res.json();
  },
};
