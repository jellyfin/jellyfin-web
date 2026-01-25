/* eslint-disable no-console */
import { execFileSync } from 'node:child_process';

const repoRoot = process.cwd();
const toolPattern = /(?:eslint|stylelint|vitest|vite|rollup|tsc|es-check|prettier|storybook)\b/i;

function parseProcessLine(line) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!match) {
        return null;
    }
    return {
        pid: Number(match[1]),
        ppid: Number(match[2]),
        command: match[3]
    };
}

function isAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    let output = '';
    try {
        output = execFileSync('ps', ['-axo', 'pid=,ppid=,command='], { encoding: 'utf8' });
    } catch (error) {
        console.warn('Failed to list processes. Cleanup skipped.', error.message);
        return;
    }

    const candidates = output
        .split('\n')
        .map(parseProcessLine)
        .filter(Boolean)
        .filter((entry) => entry.pid !== process.pid)
        .filter((entry) => entry.command.includes(repoRoot))
        .filter((entry) => toolPattern.test(entry.command));

    if (candidates.length === 0) {
        console.log('No stray tool processes found for this repo.');
        return;
    }

    const killed = [];
    for (const entry of candidates) {
        try {
            process.kill(entry.pid, 'SIGTERM');
            killed.push(entry.pid);
        } catch (error) {
            console.warn(`Failed to terminate PID ${entry.pid}: ${error.message}`);
        }
    }

    if (killed.length === 0) {
        console.warn('No processes were terminated.');
        return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const stillAlive = killed.filter((pid) => isAlive(pid));
    for (const pid of stillAlive) {
        try {
            process.kill(pid, 'SIGKILL');
        } catch (error) {
            console.warn(`Failed to SIGKILL PID ${pid}: ${error.message}`);
        }
    }

    console.log(`Terminated ${killed.length} process(es).`);
    if (stillAlive.length > 0) {
        console.log(`Force-killed ${stillAlive.length} process(es).`);
    }
}

await main();
