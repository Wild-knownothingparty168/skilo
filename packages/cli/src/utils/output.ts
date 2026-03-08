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

  return isMachineOutput() ? process.stderr : process.stdout;
}

export function isInteractiveOutput(): boolean {
  return Boolean(process.stdout.isTTY && process.stderr.isTTY);
}

export function isMachineOutput(): boolean {
  return !process.stdout.isTTY;
}

export function blankLine(): void {
  write(isMachineOutput() ? process.stderr : process.stdout);
}

export function logStatus(level: Level, message: string): void {
  const stream = level === 'error' ? process.stderr : isMachineOutput() ? process.stderr : process.stdout;
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
  for (const line of lines) {
    write(process.stderr, line);
  }
  process.exit(1);
}

export function exitWithError(message: string): never {
  logError(message);
  process.exit(1);
}
