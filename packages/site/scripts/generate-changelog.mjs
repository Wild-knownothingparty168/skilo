#!/usr/bin/env node
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

const raw = execSync("git log --format='%h|%ai|%s' --reverse", {
  cwd: root,
  encoding: "utf-8",
});

const commits = raw
  .trim()
  .split("\n")
  .map((line) => {
    const [hash, datetime, ...rest] = line.split("|");
    return { hash, date: datetime.split(" ")[0], msg: rest.join("|") };
  });

// Group by date, newest first
const byDate = new Map();
for (const c of commits) {
  if (!byDate.has(c.date)) byDate.set(c.date, []);
  byDate.get(c.date).push(c);
}

// Categorize by commit message prefix
function tag(msg) {
  if (/^Fix/i.test(msg)) return "Fixed";
  if (/^Add|^Support/i.test(msg)) return "Added";
  if (/^Remove|^Drop/i.test(msg)) return "Removed";
  return "Changed";
}

let md = "# Changelog\n\n";
md += "> All notable changes to Skilo, generated from the commit history.\n\n";

const dates = [...byDate.keys()].reverse();

for (const date of dates) {
  const entries = byDate.get(date).reverse();
  md += `## ${date}\n\n`;

  // Group by tag within each date
  const tagged = new Map();
  for (const e of entries) {
    const t = tag(e.msg);
    if (!tagged.has(t)) tagged.set(t, []);
    tagged.get(t).push(e);
  }

  for (const [label, items] of tagged) {
    if (dates.length > 1 || tagged.size > 1) {
      md += `### ${label}\n\n`;
    }
    for (const { hash, msg } of items) {
      md += `- ${msg} (\`${hash}\`)\n`;
    }
    md += "\n";
  }
}

const out = resolve(__dirname, "../public/changelog.md");
writeFileSync(out, md);
console.log(`changelog.md generated (${commits.length} commits)`);
