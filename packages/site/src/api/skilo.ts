// API client for skilo site
const API_BASE = 'https://api.skilo.dev';

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
  size: number;
  checksum: string;
  listed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ShareLink {
  token: string;
  url: string;
  expiresAt?: number;
  oneTime: boolean;
  maxUses?: number;
  usesCount: number;
}

export const api = {
  async getSkill(namespace: string, name: string): Promise<SkillMetadata> {
    const res = await fetch(`${API_BASE}/v1/skills/${namespace}/${name}`);
    if (!res.ok) throw new Error('Skill not found');
    return res.json();
  },

  async resolveShare(token: string): Promise<{ skill: SkillMetadata; requiresPassword: boolean }> {
    const res = await fetch(`${API_BASE}/v1/skills/share/${token}`);
    if (!res.ok) throw new Error('Invalid or expired share link');
    return res.json();
  },

  async verifySharePassword(token: string, password: string): Promise<SkillMetadata> {
    const res = await fetch(`${API_BASE}/v1/skills/share/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('Invalid password');
    return res.json();
  },
};
