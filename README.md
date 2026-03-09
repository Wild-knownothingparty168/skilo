# Skilo

Share agent skills with a link. No repo required.

[![Website](https://img.shields.io/badge/website-skilo.xyz-black)](https://skilo.xyz)
[![npm version](https://badge.fury.io/js/skilo-cli.svg)](https://www.npmjs.com/package/skilo-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-1f6feb.svg)](./CONTRIBUTING.md)

- Website: https://skilo.xyz
- Docs: https://skilo.xyz/docs
- CLI: https://www.npmjs.com/package/skilo-cli
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)

```
$ npx skilo-cli share ./my-skill
https://skilo.xyz/s/a3xK9mP2

$ npx skilo-cli add skilo.xyz/s/a3xK9mP2
Installed anonymous/my-skill
```

## Why Skilo?

Skill sharing usually means repos, manifests, or manual copy-paste. Skilo keeps it simple: send a skill like a link, not like a project.

**vs. Vercel's skills.sh:** skills.sh is discovery-focused with leaderboards. Skilo is transfer-focused — sharing a skill directly when there is no repo flow, no team manifest, and no desire to sign up first. Skilo also installs skills.sh skills natively.

## Features

- **Share instantly** — create a link in seconds, no registration required
- **Add anywhere** — install into Claude Code, Codex, Cursor, Amp, Windsurf, OpenCode, Cline, Roo, or OpenClaw with auto-detection or explicit target flags
- **Trust what you install** — inspect, verify checksums, then add with confidence
- **Expiring links** — one-time use, time-limited, or max-uses links
- **Password protection** — extra security for sensitive skills
- **Signed bundles** — Ed25519 signatures for verified publishers

## Quick Start

### Install

```bash
npm install -g skilo-cli
# or use without installing:
npx skilo-cli <command>
```

Every `npx skilo-cli ...` run refreshes `skilo-cli@latest` in the background so the global `skilo` binary stays ready. The installed binary also self-updates. Set `SKILO_NO_AUTO_INSTALL=1` to disable bootstrap refreshes or `SKILO_NO_AUTO_UPDATE=1` to disable self-updates.

### Share a skill

```bash
skilo share ./my-skill
skilo share ./my-skill --one-time
skilo share ./my-skill --expires 1h
skilo share ./my-skill --uses 5
skilo share ./my-skill --password
skilo share ./my-skill --listed
```

`skilo share` is transfer-first. Local shares default to unlisted even when you're logged in. Pass `--listed` if you want the skill to be searchable too.

### Login and publish

```bash
skilo login yaz
skilo login --token sk_...
skilo publish --listed
skilo publish --unlisted
skilo list --published
```

### Install a skill

```bash
skilo add https://skilo.xyz/s/a3xK9mP2
skilo add skilo.xyz/s/a3xK9mP2
skilo add https://skilo.xyz/s/a3xK9mP2 --cc
skilo add https://skilo.xyz/s/a3xK9mP2 --codex --cursor --roo
skilo add namespace/skill-name
skilo import github:user/repo
skilo import ./skill.skl

# Multi-skill repos
skilo add owner/repo --list
skilo add owner/repo --skill resolve-issue --codex
skilo add https://github.com/user/repo/tree/main/skills/resolve-issue --cursor
```

Supports Vercel-style multi-skill GitHub repos. Use `--list` to inspect discovered skills, `--skill <name>` to install a specific one, or `--all` to install everything.

### Copy skills between tools

```bash
skilo sync claude opencode
skilo sync claude opencode --all
skilo add claude --oc --all
skilo import claude --skill reviewer --oc
skilo add codex --cursor
```

Without target flags:
- if exactly one supported tool is detected, Skilo installs there automatically
- if multiple tools are detected, TTY runs prompt once and non-interactive runs return a structured no-op until you pass a target or set `SKILO_TARGETS`
- if no tool is detected, Skilo falls back to Claude Code

### Create a curated pack

```bash
skilo pack ./skills/reviewer flrabbit/original-landing-page-builder skilo.xyz/s/WMnC3vqJ --name "Founder's starter pack"
skilo add https://skilo.xyz/p/abc123
skilo add https://skilo.xyz/p/abc123 --only reviewer,planner
skilo add https://skilo.xyz/p/abc123 --skip debugger
```

Interactive `skilo add` on a pack shows a checked-by-default picker. If you deselect skills, Skilo creates a derived pack link and installs from that subset so packs stay shareable all the way through.

### Inspect before installing

```bash
skilo inspect https://skilo.xyz/s/a3xK9mP2
skilo inspect https://skilo.xyz/s/a3xK9mP2 --json
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `skilo share <path>` | Create a shareable link |
| `skilo add <skill>` | Install from a share link, registry ref, or other source |
| `skilo inspect <skill>` | View skill details without installing |
| `skilo export [path]` | Export to .skl file |
| `skilo import <source>` | Import from GitHub, .skl, or local path |
| `skilo sync [source] [targets...]` | Copy skills between tools or sync with lockfile |
| `skilo pack [sources...]` | Create a curated shareable pack |
| `skilo publish [path]` | Publish to the registry |
| `skilo login [username]` | Create or restore a publishing identity |
| `skilo list --published` | List skills under your namespace |
| `skilo init [name]` | Create a new skill |
| `skilo validate` | Validate SKILL.md |
| `skilo audit [source]` | Audit installed skills for risks |
| `skilo deprecate <skill>` | Mark a skill as deprecated |
| `skilo yank <skill@version>` | Remove a specific version |

Repo-source options for `add`, `install`, and `import`:

- `--list` list discovered skills in a repo source without installing
- `--skill <name>` install a specific discovered skill directory
- `--all` install every discovered skill in a repo source

Pack options for `pack [sources...]`:

- `--name <name>` set the pack title
- `--one-time`, `--expires`, `--uses`, `--password` apply to generated share links for local/ref sources
- `--listed`, `--unlisted` control visibility for locally published pack sources

## Agent-Friendly Usage

- `npx skilo-cli` — guided entrypoint
- `npx skilo-cli --json` — machine-readable starter payload
- `--json` flag works on `share`, `add`, `import`, `inspect`, `search`, and `info`
- `SKILO_TARGETS=codex,cursor` — control default install targets in non-interactive environments

## Vercel Compatibility

Compatible with Vercel-style GitHub skill repos:

- install from `owner/repo` with `--list`, `--skill`, or `--all`
- install from full GitHub repo and `tree/...` URLs
- discover nested `SKILL.md` directories in multi-skill repos
- detect skill paths referenced from common plugin manifests
- unlisted sharing, expiring links, password protection, and direct 1:1 handoff on top

## Supported Tools

| Tool | Directory |
|------|-----------|
| Claude Code | `~/.claude/skills/` |
| Codex | `~/.agents/skills/`, `~/.codex/skills/` |
| Cursor | `~/.cursor/skills/` |
| Amp | `~/.config/agents/skills/` |
| Windsurf | `~/.codeium/windsurf/skills/` |
| OpenCode | `~/.config/opencode/skills/` |
| Cline | `~/.cline/skills/` |
| Roo | `~/.roo/skills/` |
| OpenClaw | `~/.openclaw/skills/` |

## .skl File Format

.skl files are signed, compressed bundles for offline sharing:

```
skill.skl (tar.gz)
├── SKILL.md
├── index.js
├── src/
└── .skilo-manifest
```

## Trust & Verification

- **Anonymous** — published without authentication
- **Claimed** — a user has claimed ownership of an anonymous skill
- **Verified** — publisher identity confirmed via email or GitHub

All skills have SHA-256 checksums. Verified skills are also signed with Ed25519.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────┐
│   skilo.xyz     │────▶│ skilo API Worker │────▶│   D1    │
│  (Cloudflare    │     │  (Cloudflare     │     │  (SQL)  │
│   Pages)        │◀────│   Worker)        │◀────├─────────┤
└─────────────────┘     └──────────────────┘     │   R2    │
                                                  │(Bundles)│
                                                  ├─────────┤
                                                  │   KV    │
                                                  │(Cache)  │
                                                  └─────────┘
```

## Self-Hosting

```bash
git clone https://github.com/yazcaleb/skilo.git
cd skilo
pnpm dlx wrangler d1 create skilo
pnpm dlx wrangler r2 bucket create skilo-bundles
pnpm dlx wrangler kv namespace create "SKILLPACK_KV"
# Update wrangler.toml with your IDs
pnpm dlx wrangler d1 execute skilo --file=schema.sql --remote
pnpm --filter @skilo/api deploy
pnpm --filter @skilo/site deploy
```

## Contributing

Start with [CONTRIBUTING.md](./CONTRIBUTING.md). Keep PRs focused, tested, and documented.

## License

MIT © Plaw, Inc.
