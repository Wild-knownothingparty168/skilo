import { createInterface } from 'node:readline';
import type { DiscoveredSkill } from '../tool-dirs.js';

export interface PickerResult {
  selected: DiscoveredSkill[];
  cancelled: boolean;
}

function render(skills: DiscoveredSkill[], selected: boolean[]): string {
  const lines: string[] = [];
  for (let i = 0; i < skills.length; i++) {
    const check = selected[i] ? 'x' : ' ';
    const num = String(i + 1).padStart(String(skills.length).length);
    lines.push(`  [${check}] ${num}. ${skills[i].name}`);
    if (skills[i].description) {
      lines.push(`       ${''.padStart(String(skills.length).length)}${skills[i].description}`);
    }
  }
  lines.push('');
  lines.push('Toggle: numbers (1 3), a=all, n=none, enter=confirm, q=cancel');
  return lines.join('\n');
}

export async function pickSkills(skills: DiscoveredSkill[]): Promise<PickerResult> {
  if (!process.stdin.isTTY) {
    return { selected: skills, cancelled: false };
  }

  const selected = skills.map(() => true);
  let rendered = render(skills, selected);
  let lineCount = rendered.split('\n').length;

  process.stdout.write(rendered + '\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<PickerResult>((resolve) => {
    const ask = () => {
      rl.question('> ', (answer) => {
        const trimmed = answer.trim().toLowerCase();

        if (trimmed === 'q') {
          rl.close();
          resolve({ selected: [], cancelled: true });
          return;
        }

        if (trimmed === '') {
          rl.close();
          const picked = skills.filter((_, i) => selected[i]);
          resolve({ selected: picked, cancelled: false });
          return;
        }

        if (trimmed === 'a') {
          selected.fill(true);
        } else if (trimmed === 'n') {
          selected.fill(false);
        } else {
          const nums = trimmed.split(/\s+/).map(Number);
          for (const n of nums) {
            if (n >= 1 && n <= skills.length) {
              selected[n - 1] = !selected[n - 1];
            }
          }
        }

        // Move up past prompt line + previous render, then clear
        process.stdout.write(`\x1b[${lineCount + 1}A\x1b[J`);

        rendered = render(skills, selected);
        lineCount = rendered.split('\n').length;
        process.stdout.write(rendered + '\n');

        ask();
      });
    };

    ask();
  });
}
