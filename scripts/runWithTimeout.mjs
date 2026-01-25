import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';

const [, , timeoutArg, ...rawArgs] = process.argv;

if (!timeoutArg || rawArgs.length === 0) {
    console.error('Usage: node scripts/runWithTimeout.mjs <timeoutMs> [--max-bytes N] [--max-lines N] [--max-issues N] -- <command> [args...]');
    process.exit(1);
}

const timeoutMs = Number(timeoutArg);
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    console.error(`Invalid timeout value: ${timeoutArg}`);
    process.exit(1);
}

const defaults = {
    maxBytes: 5 * 1024 * 1024,
    maxLines: 2000,
    maxIssues: 100
};

let maxBytes = defaults.maxBytes;
let maxLines = defaults.maxLines;
let maxIssues = defaults.maxIssues;

let commandIndex = rawArgs.indexOf('--');
if (commandIndex === -1) {
    commandIndex = rawArgs.findIndex((arg) => !arg.startsWith('--'));
}

const optionArgs = commandIndex === -1 ? rawArgs : rawArgs.slice(0, commandIndex);
const commandArgs = commandIndex === -1 ? [] : rawArgs.slice(commandIndex + 1);

for (let i = 0; i < optionArgs.length; i += 1) {
    const arg = optionArgs[i];
    if (arg === '--max-bytes') {
        const value = Number(optionArgs[i + 1]);
        if (!Number.isFinite(value) || value <= 0) {
            console.error(`Invalid --max-bytes value: ${optionArgs[i + 1]}`);
            process.exit(1);
        }
        maxBytes = value;
        i += 1;
        continue;
    }
    if (arg === '--max-lines') {
        const value = Number(optionArgs[i + 1]);
        if (!Number.isFinite(value) || value <= 0) {
            console.error(`Invalid --max-lines value: ${optionArgs[i + 1]}`);
            process.exit(1);
        }
        maxLines = value;
        i += 1;
        continue;
    }
    if (arg === '--max-issues') {
        const value = Number(optionArgs[i + 1]);
        if (!Number.isFinite(value) || value <= 0) {
            console.error(`Invalid --max-issues value: ${optionArgs[i + 1]}`);
            process.exit(1);
        }
        maxIssues = value;
        i += 1;
        continue;
    }
    if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
}

if (commandArgs.length === 0) {
    console.error('Missing command. Use -- to separate options from the command.');
    process.exit(1);
}

const child = spawn(commandArgs[0], commandArgs.slice(1), {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    detached: true
});

function killProcessGroup(signal) {
    if (!child.pid) {
        return;
    }
    try {
        process.kill(-child.pid, signal);
    } catch (error) {
        try {
            child.kill(signal);
        } catch {
            // Best-effort cleanup.
        }
    }
}

let killTimer;
let forceKillTimer;
let timedOut = false;
let bytesEmitted = 0;
let linesEmitted = 0;
let issuesEmitted = 0;
let shouldCleanup = false;
let lineBuffer = '';

const issueLinePatterns = [
    /^\s*\d+:\d+\s+(error|warning)\b/i,
    /^\s*\d+:\d+\s+✖\s+/,
    /\berror\s+TS\d+\b/i,
    /\bwarning\s+TS\d+\b/i,
    /^\s*[×✗]\s+/,
    /^\s*FAIL\b/i
];

function countIssuesFromLine(line) {
    for (const pattern of issueLinePatterns) {
        if (pattern.test(line)) {
            return 1;
        }
    }
    return 0;
}

function runCleanup() {
    const cleanupScript = path.resolve(process.cwd(), 'scripts/cleanupStrayProcesses.mjs');
    try {
        execFileSync(process.execPath, [cleanupScript], { stdio: 'inherit' });
    } catch (error) {
        console.error('Cleanup failed:', error.message);
    }
}

killTimer = setTimeout(() => {
    timedOut = true;
    shouldCleanup = true;
    console.error(`[timeout] Command exceeded ${timeoutMs}ms: ${commandArgs.join(' ')}`);
    killProcessGroup('SIGTERM');
    forceKillTimer = setTimeout(() => {
        killProcessGroup('SIGKILL');
    }, 5000);
}, timeoutMs);

function handleOutput(chunk) {
    const text = chunk.toString();
    bytesEmitted += Buffer.byteLength(chunk);
    lineBuffer += text;
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';
    linesEmitted += lines.length;
    for (const line of lines) {
        issuesEmitted += countIssuesFromLine(line);
    }

    if (bytesEmitted > maxBytes) {
        shouldCleanup = true;
        console.error(`[timeout] Output exceeded ${maxBytes} bytes: ${commandArgs.join(' ')}`);
        killProcessGroup('SIGTERM');
        return;
    }

    if (linesEmitted > maxLines) {
        shouldCleanup = true;
        console.error(`[timeout] Output exceeded ${maxLines} lines: ${commandArgs.join(' ')}`);
        killProcessGroup('SIGTERM');
    }

    if (issuesEmitted > maxIssues) {
        shouldCleanup = true;
        console.error(`[timeout] Output exceeded ${maxIssues} issues: ${commandArgs.join(' ')}`);
        killProcessGroup('SIGTERM');
    }
}

if (child.stdout) {
    child.stdout.on('data', (chunk) => {
        process.stdout.write(chunk);
        handleOutput(chunk);
    });
}

if (child.stderr) {
    child.stderr.on('data', (chunk) => {
        process.stderr.write(chunk);
        handleOutput(chunk);
    });
}

child.on('error', (error) => {
    if (killTimer) {
        clearTimeout(killTimer);
    }
    if (forceKillTimer) {
        clearTimeout(forceKillTimer);
    }
    console.error('Failed to start command:', error);
    process.exit(1);
});

child.on('exit', (code, signal) => {
    if (killTimer) {
        clearTimeout(killTimer);
    }
    if (forceKillTimer) {
        clearTimeout(forceKillTimer);
    }
    if (signal || timedOut) {
        if (shouldCleanup) {
            runCleanup();
        }
        process.exit(1);
    }
    if (shouldCleanup) {
        runCleanup();
    }
    process.exit(code ?? 1);
});

process.on('SIGINT', () => {
    killProcessGroup('SIGINT');
});

process.on('SIGTERM', () => {
    killProcessGroup('SIGTERM');
});
