#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

import { auditBuildOutput } from './audit-build-output.mjs';
import { runSubpathSmoke } from './smoke-build-subpath.mjs';

const parseArguments = argv => {
    const options = {
        output: 'build-output-baseline.json',
        skipBuild: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--skip-build') {
            options.skipBuild = true;
        } else if (argument === '--output') {
            options.output = argv[index + 1];
            index += 1;
        } else if (argument === '--duration-ms') {
            options.durationMs = Number(argv[index + 1]);
            index += 1;
        } else if (argument === '--audit-output') {
            options.auditOutput = argv[index + 1];
            index += 1;
        } else if (argument === '--markdown-output') {
            options.markdownOutput = argv[index + 1];
            index += 1;
        } else if (argument === '--compare-to') {
            options.compareTo = argv[index + 1];
            index += 1;
        } else {
            throw new Error(`unknown argument: ${argument}`);
        }
    }

    if (options.durationMs !== undefined && !Number.isFinite(options.durationMs)) {
        throw new Error('--duration-ms requires a finite number');
    }
    for (const [ option, argument ] of [
        [ 'output', '--output' ],
        [ 'auditOutput', '--audit-output' ],
        [ 'markdownOutput', '--markdown-output' ],
        [ 'compareTo', '--compare-to' ]
    ]) {
        if (
            Object.hasOwn(options, option)
            && (!options[option] || options[option].startsWith('--'))
        ) {
            throw new Error(`${argument} requires a path`);
        }
    }
    return options;
};

const listFilesWithSizes = async (directory, root = directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await listFilesWithSizes(entryPath, root));
        } else if (entry.isFile()) {
            const fileStats = await stat(entryPath);
            files.push({
                bytes: fileStats.size,
                path: path.relative(root, entryPath).split(path.sep).join('/')
            });
        }
    }

    return files.sort((first, second) => first.path.localeCompare(second.path));
};

const selectModernInitialAssets = references => {
    const scripts = references.filter(reference => reference.kind === 'script');
    const moduleScripts = scripts.filter(reference => (
        reference.attributes.type?.toLowerCase() === 'module'
    ));
    const selectedScripts = moduleScripts.length ?
        moduleScripts :
        scripts.filter(reference => !Object.hasOwn(reference.attributes, 'nomodule'));
    const styles = references.filter(reference => reference.kind === 'stylesheet');
    const modulePreloads = references.filter(reference => reference.kind === 'modulepreload');

    return [ ...selectedScripts, ...styles, ...modulePreloads ]
        .map(reference => reference.relativePath)
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort();
};

const measureCompressedAssets = async (distDirectory, relativePaths) => {
    const assets = [];
    for (const relativePath of relativePaths) {
        const contents = await readFile(path.join(distDirectory, relativePath));
        assets.push({
            path: relativePath,
            rawBytes: contents.byteLength,
            gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
            brotliBytes: brotliCompressSync(contents, {
                params: {
                    [constants.BROTLI_PARAM_QUALITY]: 11
                }
            }).byteLength
        });
    }

    return {
        assets,
        assetCount: assets.length,
        rawBytes: assets.reduce((total, asset) => total + asset.rawBytes, 0),
        gzipBytes: assets.reduce((total, asset) => total + asset.gzipBytes, 0),
        brotliBytes: assets.reduce((total, asset) => total + asset.brotliBytes, 0)
    };
};

const getCommit = projectRoot => {
    try {
        // eslint-disable-next-line sonarjs/no-os-command-from-path -- Git is optional and failure is handled below.
        return execFileSync('git', [ 'rev-parse', 'HEAD' ], {
            cwd: projectRoot,
            encoding: 'utf8'
        }).trim();
    } catch {
        return '';
    }
};

const runProductionBuild = projectRoot => {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const startedAt = process.hrtime.bigint();
    const result = spawnSync(npmCommand, [ 'run', 'build:production' ], {
        cwd: projectRoot,
        env: process.env,
        stdio: 'inherit'
    });
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`production build exited with status ${result.status}`);
    }
    return Math.round(durationMs);
};

const compareMetric = (baselineValue, currentValue) => {
    const delta = currentValue - baselineValue;
    return {
        baseline: baselineValue,
        current: currentValue,
        delta,
        deltaPercent: baselineValue === 0 ? null : Number((delta / baselineValue * 100).toFixed(2))
    };
};

const createComparison = (baseline, current, baselineFile) => ({
    baselineFile,
    baselineCommit: baseline.commit,
    metrics: {
        buildDurationMs: compareMetric(baseline.build.durationMs, current.build.durationMs),
        outputFileCount: compareMetric(baseline.output.fileCount, current.output.fileCount),
        outputTotalBytes: compareMetric(baseline.output.totalBytes, current.output.totalBytes),
        modernInitialAssetCount: compareMetric(
            baseline.modernInitialGraph.assetCount,
            current.modernInitialGraph.assetCount
        ),
        modernInitialRawBytes: compareMetric(
            baseline.modernInitialGraph.rawBytes,
            current.modernInitialGraph.rawBytes
        ),
        modernInitialGzipBytes: compareMetric(
            baseline.modernInitialGraph.gzipBytes,
            current.modernInitialGraph.gzipBytes
        ),
        modernInitialBrotliBytes: compareMetric(
            baseline.modernInitialGraph.brotliBytes,
            current.modernInitialGraph.brotliBytes
        )
    }
});

const formatNumber = value => value === null ? 'n/a' : value.toLocaleString('en-US');

const formatDeltaPercent = value => {
    if (value === null) return 'n/a';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const createMarkdownReport = (report, audit) => {
    const metricLabels = {
        buildDurationMs: 'Build duration (ms)',
        outputFileCount: 'Output files',
        outputTotalBytes: 'Output bytes',
        modernInitialAssetCount: 'Modern initial assets',
        modernInitialRawBytes: 'Modern initial raw bytes',
        modernInitialGzipBytes: 'Modern initial gzip bytes',
        modernInitialBrotliBytes: 'Modern initial Brotli bytes'
    };
    const rows = Object.entries(report.comparison.metrics).map(([ name, metric ]) => (
        `| ${metricLabels[name]} | ${formatNumber(metric.baseline)} | ${formatNumber(metric.current)} | ${formatNumber(metric.delta)} | ${formatDeltaPercent(metric.deltaPercent)} |`
    ));
    const activeExceptions = audit.baselineExceptions
        .filter(exception => exception.active)
        .map(exception => `${exception.id} (remove in ${exception.removeIn})`);

    return [
        '# Build audit and bundle-size comparison',
        '',
        `- Build audit: **${audit.status}**`,
        `- Baseline commit: \`${report.comparison.baselineCommit}\``,
        `- Current commit: \`${report.commit}\``,
        `- Active baseline exceptions: ${activeExceptions.length ? activeExceptions.join(', ') : 'none'}`,
        '',
        '| Metric | Baseline | Current | Delta | Change |',
        '| --- | ---: | ---: | ---: | ---: |',
        ...rows,
        '',
        'Change is the percentage difference from the checked-in baseline.',
        ''
    ].join('\n');
};

const writeOutputFile = async (projectRoot, filePath, contents) => {
    const resolvedPath = path.resolve(projectRoot, filePath);
    await mkdir(path.dirname(resolvedPath), { recursive: true });
    await writeFile(resolvedPath, contents);
    return path.relative(projectRoot, resolvedPath);
};

const options = parseArguments(process.argv.slice(2));
const projectRoot = process.cwd();
const distDirectory = path.join(projectRoot, 'dist');
const durationMs = options.skipBuild ?
    (options.durationMs ?? null) :
    runProductionBuild(projectRoot);

const audit = await auditBuildOutput({ projectRoot, distDirectory });
if (audit.errors.length) {
    throw new Error(`output audit failed:\n${audit.errors.join('\n')}`);
}

const smoke = await runSubpathSmoke({ projectRoot, distDirectory });
if (smoke.failures.length) {
    throw new Error(`subpath smoke test failed:\n${smoke.failures.join('\n')}`);
}

const outputFiles = await listFilesWithSizes(distDirectory);
const initialAssetPaths = selectModernInitialAssets(audit.html.references);
const initialGraph = await measureCompressedAssets(distDirectory, initialAssetPaths);
const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
const hasModernModuleGraph = audit.html.references.some(reference => (
    reference.kind === 'script'
    && reference.attributes.type?.toLowerCase() === 'module'
));

const baseline = {
    schemaVersion: 1,
    recordedAt: new Date().toISOString(),
    commit: getCommit(projectRoot),
    packageVersion: packageJson.version,
    build: {
        command: 'npm run build:production',
        durationMs
    },
    environment: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch
    },
    output: {
        directory: 'dist',
        fileCount: outputFiles.length,
        totalBytes: outputFiles.reduce((total, file) => total + file.bytes, 0)
    },
    modernInitialGraph: {
        selection: hasModernModuleGraph ?
            'module scripts, module preloads, and stylesheets' :
            'current single-target page scripts and stylesheets',
        ...initialGraph
    },
    serviceWorker: audit.serviceWorker,
    baselineExceptions: audit.baselineExceptions,
    subpathSmoke: smoke.checked
};

if (options.compareTo) {
    const comparisonPath = path.resolve(projectRoot, options.compareTo);
    const comparisonBaseline = JSON.parse(await readFile(comparisonPath, 'utf8'));
    baseline.comparison = createComparison(
        comparisonBaseline,
        baseline,
        path.relative(projectRoot, comparisonPath)
    );
}

const outputPath = await writeOutputFile(
    projectRoot,
    options.output,
    `${JSON.stringify(baseline, null, 2)}\n`
);
console.log(`Build baseline written to ${outputPath}`);

if (options.auditOutput) {
    const auditPath = await writeOutputFile(
        projectRoot,
        options.auditOutput,
        `${JSON.stringify(audit, null, 2)}\n`
    );
    console.log(`Build audit written to ${auditPath}`);
}

if (options.markdownOutput) {
    if (!baseline.comparison) {
        throw new Error('--markdown-output requires --compare-to');
    }
    const markdownPath = await writeOutputFile(
        projectRoot,
        options.markdownOutput,
        createMarkdownReport(baseline, audit)
    );
    console.log(`Build comparison written to ${markdownPath}`);
}
