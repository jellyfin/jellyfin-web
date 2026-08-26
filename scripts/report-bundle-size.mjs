import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2] || 'dist';
const limit = Number.parseInt(process.env.BUNDLE_REPORT_LIMIT || '25', 10);

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...await walk(fullPath));
        } else if (entry.isFile()) {
            const fileStat = await stat(fullPath);
            files.push({
                path: path.relative(root, fullPath),
                size: fileStat.size
            });
        }
    }

    return files;
}

function formatBytes(bytes) {
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

try {
    const files = await walk(root);
    const total = files.reduce((sum, file) => sum + file.size, 0);
    const largest = files
        .sort((a, b) => b.size - a.size)
        .slice(0, limit);

    console.log(`Bundle root: ${root}`);
    console.log(`Total files: ${files.length}`);
    console.log(`Total size: ${formatBytes(total)}`);
    console.log('');
    console.log(`Largest ${largest.length} files:`);

    for (const file of largest) {
        console.log(`${formatBytes(file.size).padStart(10)}  ${file.path}`);
    }
} catch (err) {
    console.error(`Unable to read bundle output from ${root}. Run a build first.`);
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
}
