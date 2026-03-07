// Export skill to .skl file
import { readFile, readdir, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import * as tar from 'tar';

interface ExportOptions {
  output?: string;
  sign?: boolean;
}

export async function exportCommand(path: string = '.', options: ExportOptions = {}): Promise<void> {
  const skillPath = resolve(path);

  try {
    // Validate SKILL.md exists
    const skillMdPath = join(skillPath, 'SKILL.md');
    await readFile(skillMdPath, 'utf-8');
  } catch {
    console.error(`Error: No SKILL.md found in ${skillPath}`);
    console.error('Make sure you\'re in a skill directory or specify the correct path.');
    process.exit(1);
  }

  try {
    // Determine output filename
    const skillName = basename(skillPath);
    const outputFile = options.output
      ? resolve(options.output)
      : join(process.cwd(), `${skillName}.skl`);

    console.log(`Exporting ${skillName}...`);

    // Create manifest
    const manifest = {
      name: skillName,
      exportedAt: new Date().toISOString(),
      version: '1.0.0', // Could read from SKILL.md
    };

    // Create temp directory for manifest
    const tempDir = join(skillPath, '.skilo-temp');
    await mkdir(tempDir, { recursive: true });
    await writeFile(join(tempDir, '.skilo-manifest'), JSON.stringify(manifest, null, 2));

    // Create tar.gz
    const output = createWriteStream(outputFile);
    const gzip = createGzip();

    // Get all files except node_modules, .git, etc.
    const files = await getFiles(skillPath);

    await tar.create(
      {
        gzip: true,
        file: outputFile,
        cwd: skillPath,
      },
      files
    );

    // Clean up temp
    await rm(tempDir, { recursive: true, force: true });

    console.log(`✓ Exported to ${outputFile}`);
    console.log(`  Share with: skilo import ${outputFile}`);
  } catch (e) {
    console.error(`Export failed: ${(e as Error).message}`);
    process.exit(1);
  }
}

async function getFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.slice(dir.length + 1);

    // Skip common excludes
    if (shouldExclude(entry.name)) continue;

    if (entry.isDirectory()) {
      const subFiles = await getFiles(fullPath);
      files.push(...subFiles.map(f => join(entry.name, f)));
    } else {
      files.push(entry.name);
    }
  }

  return files;
}

function shouldExclude(name: string): boolean {
  const excludes = [
    'node_modules',
    '.git',
    '.DS_Store',
    '.skilo-temp',
    'dist',
    'build',
    '*.log',
  ];
  return excludes.some(ex => name === ex || name.startsWith('.'));
}
