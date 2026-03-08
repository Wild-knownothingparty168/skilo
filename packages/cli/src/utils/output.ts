const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
} as const;

type Level = 'info' | 'success' | 'warn' | 'error';

const LABELS: Record<Level, string> = {
  info: 'info',
  success: 'ok',
  warn: 'warn',
  error: 'error',
};

const COLORS: Record<Level, string> = {
  info: ANSI.blue,
  success: ANSI.green,
  warn: ANSI.yellow,
  error: ANSI.red,
};

function supportsColor(): boolean {
  return Boolean(process.stderr.isTTY);
}

function formatLabel(level: Level): string {
  const label = `[${LABELS[level]}]`;
  if (!supportsColor()) {
    return label;
  }

  return `${COLORS[level]}${label}${ANSI.reset}`;
}

function write(stream: NodeJS.WriteStream, message = ''): void {
  stream.write(`${message}\n`);
}

function resolveStream(target: 'notice' | 'primary'): NodeJS.WriteStream {
  if (target === 'primary') {
    return process.stdout;
  }

  return isMachineOutput() || isJsonOutput() ? process.stderr : process.stdout;
}

export function isInteractiveOutput(): boolean {
  return Boolean(process.stdout.isTTY && process.stderr.isTTY);
}

export function isMachineOutput(): boolean {
  return !process.stdout.isTTY;
}

export function isJsonOutput(): boolean {
  return process.argv.includes('--json') || process.env.SKILO_OUTPUT === 'json';
}

export function blankLine(): void {
  if (isJsonOutput()) {
    return;
  }

  write(isMachineOutput() ? process.stderr : process.stdout);
}

export function logStatus(level: Level, message: string): void {
  const stream = level === 'error' || isMachineOutput() || isJsonOutput() ? process.stderr : process.stdout;
  write(stream, `${formatLabel(level)} ${message}`);
}

export function logInfo(message: string): void {
  logStatus('info', message);
}

export function logSuccess(message: string): void {
  logStatus('success', message);
}

export function logWarn(message: string): void {
  logStatus('warn', message);
}

export function logError(message: string): void {
  logStatus('error', message);
}

export function printPrimary(message: string): void {
  write(process.stdout, message);
}

export function printJson(value: unknown): void {
  write(process.stdout, JSON.stringify(value, null, 2));
}

export function printNote(label: string, value: string, target: 'notice' | 'primary' = 'notice'): void {
  const stream = resolveStream(target);
  const title = supportsColor() && !isMachineOutput() ? `${ANSI.dim}${label}:${ANSI.reset}` : `${label}:`;
  write(stream, `${title} ${value}`);
}

export function printSection(title: string, target: 'notice' | 'primary' = 'notice'): void {
  const stream = resolveStream(target);
  if (supportsColor() && !isMachineOutput()) {
    write(stream, `${ANSI.bold}${title}${ANSI.reset}`);
    return;
  }

  write(stream, title);
}

export function printKeyValue(label: string, value: string, width = 12, target: 'notice' | 'primary' = 'primary'): void {
  const stream = resolveStream(target);
  write(stream, `${label.padEnd(width)} ${value}`);
}

export function printUsage(lines: string[]): never {
  if (isJsonOutput()) {
    write(process.stderr, JSON.stringify({ error: 'usage_error', lines }, null, 2));
    process.exit(1);
  }

  for (const line of lines) {
    write(process.stderr, line);
  }
  process.exit(1);
}

export function exitWithError(message: string): never {
  if (isJsonOutput()) {
    write(process.stderr, JSON.stringify({ error: 'command_failed', message }, null, 2));
    process.exit(1);
  }

  logError(message);
  process.exit(1);
}
