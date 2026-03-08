const API_BASE = 'https://skilo-api.yaz-b35.workers.dev';

const STATIC_MARKDOWN = {
  '/': '/llms-full.txt',
  '/docs': '/docs.md',
  '/docs/': '/docs.md',
  '/claim': '/claim.md',
  '/claim/': '/claim.md',
};

const LLM_BOTS =
  /GPTBot|ChatGPT-User|Claude-Web|ClaudeBot|Anthropic|PerplexityBot|Google-Extended|CCBot|cohere-ai|Bytespider|Amazonbot|FacebookBot|Meta-ExternalAgent|AI2Bot|Applebot-Extended|Diffbot|YouBot|Sidetrade|PetalBot/i;

function shouldServeMarkdown(request) {
  const accept = request.headers.get('accept') || '';
  const ua = request.headers.get('user-agent') || '';
  return accept.includes('text/markdown') || LLM_BOTS.test(ua);
}

function md(body, maxAge = 3600) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}`,
      'X-Content-Format': 'markdown',
    },
  });
}

async function extractSkillMd(tarballUrl) {
  const url = tarballUrl.startsWith('http') ? tarballUrl : `${API_BASE}${tarballUrl}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const decompressed = res.body.pipeThrough(new DecompressionStream('gzip'));
  const reader = decompressed.getReader();
  const chunks = [];
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

  const decoder = new TextDecoder();
  let pos = 0;
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
  return null;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (!shouldServeMarkdown(context.request)) {
    return context.next();
  }

  // ── Static pages ──
  const staticFile = STATIC_MARKDOWN[path];
  if (staticFile) {
    const mdUrl = new URL(staticFile, context.request.url);
    const response = await context.env.ASSETS.fetch(mdUrl.toString());
    if (response.ok) return md(response.body);
  }

  // ── Skill page: /s/:token ──
  const shareMatch = path.match(/^\/s\/([A-Za-z0-9_-]+)$/);
  if (shareMatch) {
    try {
      const token = shareMatch[1];
      const apiRes = await fetch(`${API_BASE}/v1/skills/share/${token}`);
      if (!apiRes.ok) return context.next();

      const data = await apiRes.json();
      if (data.requiresPassword) {
        return md('# Password protected skill\n\nThis skill requires a password to view.\n');
      }

      const s = data.skill;
      let out = `# ${s.namespace}/${s.name}\n\n`;
      if (s.description) out += `> ${s.description}\n\n`;
      out += `- **Version:** ${s.version}\n`;
      if (s.author) out += `- **Author:** ${s.author}\n`;
      out += `- **Checksum:** \`${s.checksum}\`\n`;
      out += `- **Size:** ${(s.size / 1024).toFixed(1)} KB\n`;
      if (s.homepage) out += `- **Homepage:** ${s.homepage}\n`;
      if (s.repository) out += `- **Repository:** ${s.repository}\n`;
      if (s.keywords?.length) out += `- **Keywords:** ${s.keywords.join(', ')}\n`;
      out += `\n## Install\n\n\`\`\`\nskilo add skilo.xyz/s/${token}\n\`\`\`\n`;

      if (s.tarballUrl) {
        try {
          const content = await extractSkillMd(s.tarballUrl);
          if (content) {
            out += `\n---\n\n## SKILL.md\n\n${content}\n`;
          }
        } catch {}
      }

      return md(out, 300);
    } catch {
      return context.next();
    }
  }

  // ── Pack page: /p/:token ──
  const packMatch = path.match(/^\/p\/([A-Za-z0-9_-]+)$/);
  if (packMatch) {
    try {
      const token = packMatch[1];
      const apiRes = await fetch(`${API_BASE}/v1/packs/${token}`);
      if (!apiRes.ok) return context.next();

      const data = await apiRes.json();
      let out = `# ${data.name || 'Skill Pack'}\n\n`;
      out += `${data.skills.length} skill${data.skills.length === 1 ? '' : 's'}:\n\n`;
      for (const s of data.skills) {
        out += `- **${s.namespace}/${s.name}** — ${s.description} ([view](https://skilo.xyz/s/${s.shareToken}))\n`;
      }
      out += `\n## Install all\n\n\`\`\`\n`;
      for (const s of data.skills) {
        out += `skilo add skilo.xyz/s/${s.shareToken}\n`;
      }
      out += `\`\`\`\n`;
      return md(out, 300);
    } catch {
      return context.next();
    }
  }

  return context.next();
}
