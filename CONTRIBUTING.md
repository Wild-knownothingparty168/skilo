# Contributing to Skilo

Thanks for contributing.

## Setup

```bash
pnpm install
pnpm build
```

## Local Development

```bash
pnpm --filter skilo-cli build
pnpm --filter @skilo/site dev
pnpm --filter @skilo/api dev
```

## Project Structure

- `packages/cli` - published CLI package and install/share flows
- `packages/api` - Cloudflare Worker API
- `packages/site` - site, docs, and Pages middleware
- `packages/shared` - shared types and manifest helpers

## Pull Requests

Please keep PRs focused and easy to review.

- explain the user-facing problem
- keep unrelated refactors out
- include command-level verification when possible
- update docs when behavior changes
- prefer explicit diffs over broad rewrites

## Quality Bar

- keep CLI output clear for both humans and agents
- preserve compatibility with supported tools and skill directories
- avoid regressions in share, inspect, add, import, and publish flows
- call out trust, auth, or verification changes clearly
