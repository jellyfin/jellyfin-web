#!/usr/bin/env node

import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const STABLE_ROOT_FILES = [
    'index.html',
    'config.json',
    'manifest.json',
    'robots.txt',
    'serviceworker.js'
];

export const STABLE_DIRECTORIES = [
    'assets',
    'favicons',
    'libraries',
    'themes'
];

export const LIBRARY_FILES = [
    'default.woff2',
    'libarchive.wasm',
    'npo.js',
    'pdf.worker.js',
    'subtitles-octopus-worker-legacy.js',
    'subtitles-octopus-worker.js',
    'subtitles-octopus-worker.wasm',
    'worker-bundle.js'
];

export const PLAYER_LIBRARY_CONTRACTS = [
    {
        source: 'src/plugins/comicsPlayer/plugin.js',
        files: [ 'worker-bundle.js' ]
    },
    {
        source: 'src/plugins/pdfPlayer/plugin.js',
        files: [ 'pdf.worker.js' ]
    },
    {
        source: 'src/plugins/htmlVideoPlayer/plugin.js',
        files: [
            'subtitles-octopus-worker-legacy.js',
            'subtitles-octopus-worker.js'
        ]
    }
];

const REQUIRED_MANIFEST_ICON_PREFIX = 'favicons/';
// eslint-disable-next-line sonarjs/no-clear-text-protocols -- Synthetic URL used only for local path resolution.
const HTML_BASE_URL = 'http://build-audit.invalid/';

const isPathInside = (parent, child) => {
    const relativePath = path.relative(parent, child);
    return relativePath === '' || (
        !relativePath.startsWith(`..${path.sep}`)
        && relativePath !== '..'
        && !path.isAbsolute(relativePath)
    );
};

const pathExists = async filePath => {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
};

const listFiles = async directory => {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            for (const nestedFile of await listFiles(entryPath)) {
                files.push(path.join(entry.name, nestedFile));
            }
        } else if (entry.isFile()) {
            files.push(entry.name);
        }
    }

    return files.sort();
};

const parseAttributes = source => {
    const attributes = {};
    // eslint-disable-next-line sonarjs/regex-complexity -- Parses a constrained set of generated HTML attributes.
    const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match;

    while ((match = attributePattern.exec(source))) {
        const name = match[1].toLowerCase();
        attributes[name] = match[2] ?? match[3] ?? match[4] ?? '';
    }

    return attributes;
};

const classifyHtmlReference = (tagName, attributes) => {
    if (tagName === 'script' && attributes.src) {
        return 'script';
    }

    if (tagName === 'link' && attributes.href) {
        const rel = new Set((attributes.rel || '').toLowerCase().split(/\s+/).filter(Boolean));
        if (rel.has('stylesheet')) return 'stylesheet';
        if (rel.has('manifest')) return 'manifest';
        if (rel.has('modulepreload')) return 'modulepreload';
        if (rel.has('icon') || rel.has('apple-touch-icon')) return 'favicon';
    }

    if (
        tagName === 'meta'
        && attributes.content
        && attributes.name?.toLowerCase() === 'msapplication-tileimage'
    ) {
        return 'favicon';
    }

    return null;
};

export const parseHtmlReferences = html => {
    const references = [];
    const tagPattern = /<(script|link|meta)\b([^>]*)>/gi;
    let match;

    while ((match = tagPattern.exec(html))) {
        const tagName = match[1].toLowerCase();
        const attributes = parseAttributes(match[2]);
        const kind = classifyHtmlReference(tagName, attributes);
        if (!kind) continue;

        references.push({
            attributes,
            kind,
            tagName,
            url: attributes.src || attributes.href || attributes.content
        });
    }

    return references;
};

export const resolveLocalReference = (urlValue, distDirectory) => {
    if (!urlValue || urlValue.startsWith('#')) return null;

    let url;
    try {
        url = new URL(urlValue, HTML_BASE_URL);
    } catch (error) {
        return { error: `invalid URL ${JSON.stringify(urlValue)}: ${error.message}` };
    }

    if (url.origin !== new URL(HTML_BASE_URL).origin) return null;

    let decodedPath;
    try {
        decodedPath = decodeURIComponent(url.pathname);
    } catch (error) {
        return { error: `invalid URL encoding in ${JSON.stringify(urlValue)}: ${error.message}` };
    }

    const relativePath = decodedPath.replace(/^\/+/, '');
    const absolutePath = path.resolve(distDirectory, relativePath);
    if (!relativePath || !isPathInside(distDirectory, absolutePath)) {
        return { error: `reference escapes dist: ${JSON.stringify(urlValue)}` };
    }

    return {
        absolutePath,
        relativePath
    };
};

const extractLibraryUrls = source => {
    const files = new Set();
    const pattern = /\/libraries\/([A-Za-z0-9._-]+)/g;
    let match;

    while ((match = pattern.exec(source))) files.add(match[1]);
    return [ ...files ].sort();
};

const extractServiceWorkerDependencies = source => {
    const directImports = new Set();
    const importPatterns = [
        /\bimportScripts\s*\(\s*['"]([^'"]+)['"]/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        // eslint-disable-next-line sonarjs/slow-regex -- Input is a locally generated service-worker bundle.
        /\bimport\s+[^'"]*?\sfrom\s*['"]([^'"]+)['"]/g
    ];

    for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(source))) directImports.add(match[1]);
    }

    const webpackSharedChunkIds = new Set();
    const webpackDependencyPattern = /\.O\(\d+,\[([\d,\s]+)\]/g;
    let dependencyMatch;
    while ((dependencyMatch = webpackDependencyPattern.exec(source))) {
        for (const id of dependencyMatch[1].split(',')) {
            const normalizedId = id.trim();
            if (normalizedId) webpackSharedChunkIds.add(normalizedId);
        }
    }

    const usesWebpackRuntime = /\bwebpackChunk\b/.test(source);

    return {
        directImports: [ ...directImports ].sort(),
        importsSharedApplicationChunks: directImports.size > 0
            || (usesWebpackRuntime && webpackSharedChunkIds.size > 0),
        usesWebpackRuntime,
        webpackSharedChunkIds: [ ...webpackSharedChunkIds ].sort()
    };
};

const readJson = async (filePath, errors, label) => {
    try {
        return JSON.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
        errors.push(`${label} is not valid JSON: ${error.message}`);
        return null;
    }
};

const checkFile = async (filePath, errors, label) => {
    try {
        const fileStats = await stat(filePath);
        if (!fileStats.isFile()) errors.push(`${label} is not a file`);
    } catch {
        errors.push(`${label} is missing`);
    }
};

const checkDirectory = async (directory, errors, label) => {
    try {
        const directoryStats = await stat(directory);
        if (!directoryStats.isDirectory()) errors.push(`${label} is not a directory`);
    } catch {
        errors.push(`${label} is missing`);
    }
};

/* eslint-disable sonarjs/cognitive-complexity -- Linear aggregation of independent contract checks. */
export const auditBuildOutput = async ({
    projectRoot = process.cwd(),
    distDirectory = path.join(projectRoot, 'dist')
} = {}) => {
    const errors = [];
    const warnings = [];
    const resolvedDistDirectory = path.resolve(distDirectory);

    await checkDirectory(resolvedDistDirectory, errors, 'dist');

    for (const relativePath of STABLE_ROOT_FILES) {
        await checkFile(
            path.join(resolvedDistDirectory, relativePath),
            errors,
            `stable output ${relativePath}`
        );
    }

    for (const relativePath of STABLE_DIRECTORIES) {
        await checkDirectory(
            path.join(resolvedDistDirectory, relativePath),
            errors,
            `stable output directory ${relativePath}`
        );
    }

    const sourceAssetsDirectory = path.join(projectRoot, 'src/assets');
    const sourceAssetFiles = await pathExists(sourceAssetsDirectory) ?
        await listFiles(sourceAssetsDirectory) :
        [];
    for (const relativePath of sourceAssetFiles) {
        await checkFile(
            path.join(resolvedDistDirectory, 'assets', relativePath),
            errors,
            `copied asset assets/${relativePath}`
        );
    }

    for (const libraryFile of LIBRARY_FILES) {
        await checkFile(
            path.join(resolvedDistDirectory, 'libraries', libraryFile),
            errors,
            `copied library libraries/${libraryFile}`
        );
    }

    const faviconSourceDirectory = path.join(
        projectRoot,
        'node_modules/@jellyfin/ux-web/favicons'
    );
    let faviconFiles = [];
    if (await pathExists(faviconSourceDirectory)) {
        faviconFiles = (await readdir(faviconSourceDirectory))
            .filter(fileName => /^touchicon.*\.png$/i.test(fileName))
            .sort();
        for (const faviconFile of faviconFiles) {
            await checkFile(
                path.join(resolvedDistDirectory, 'favicons', faviconFile),
                errors,
                `copied favicon favicons/${faviconFile}`
            );
        }
    } else {
        errors.push('favicon source node_modules/@jellyfin/ux-web/favicons is missing');
    }

    const indexPath = path.join(resolvedDistDirectory, 'index.html');
    let references = [];
    if (await pathExists(indexPath)) {
        const html = await readFile(indexPath, 'utf8');
        references = parseHtmlReferences(html);

        for (const reference of references) {
            const resolvedReference = resolveLocalReference(reference.url, resolvedDistDirectory);
            if (!resolvedReference) continue;
            if (resolvedReference.error) {
                errors.push(`${reference.kind} ${resolvedReference.error}`);
                continue;
            }

            reference.relativePath = resolvedReference.relativePath;
            await checkFile(
                resolvedReference.absolutePath,
                errors,
                `${reference.kind} reference ${reference.url}`
            );
        }
    }

    const sourceConfig = await readJson(
        path.join(projectRoot, 'src/config.json'),
        errors,
        'src/config.json'
    );
    const themeIds = [];
    if (!Array.isArray(sourceConfig?.themes)) {
        errors.push('src/config.json does not contain a themes array');
    } else {
        const seenThemeIds = new Set();
        for (const theme of sourceConfig.themes) {
            const themeId = theme?.id;
            if (typeof themeId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(themeId)) {
                errors.push(`invalid configured theme id: ${JSON.stringify(themeId)}`);
                continue;
            }
            if (seenThemeIds.has(themeId)) {
                errors.push(`duplicate configured theme id: ${themeId}`);
                continue;
            }
            seenThemeIds.add(themeId);
            themeIds.push(themeId);
            await checkFile(
                path.join(resolvedDistDirectory, 'themes', themeId, 'theme.css'),
                errors,
                `configured theme themes/${themeId}/theme.css`
            );
        }
    }

    const manifest = await readJson(
        path.join(resolvedDistDirectory, 'manifest.json'),
        errors,
        'dist/manifest.json'
    );
    const manifestIcons = [];
    if (!Array.isArray(manifest?.icons)) {
        errors.push('dist/manifest.json does not contain an icons array');
    } else {
        for (const icon of manifest.icons) {
            if (typeof icon?.src !== 'string' || !icon.src.startsWith(REQUIRED_MANIFEST_ICON_PREFIX)) {
                errors.push(`manifest icon does not use ${REQUIRED_MANIFEST_ICON_PREFIX}: ${JSON.stringify(icon?.src)}`);
                continue;
            }
            const resolvedIcon = resolveLocalReference(icon.src, resolvedDistDirectory);
            if (!resolvedIcon || resolvedIcon.error) {
                errors.push(`invalid manifest icon reference: ${JSON.stringify(icon.src)}`);
                continue;
            }
            manifestIcons.push(resolvedIcon.relativePath);
            await checkFile(
                resolvedIcon.absolutePath,
                errors,
                `manifest icon ${icon.src}`
            );
        }
    }

    const playerLibraryReferences = {};
    for (const contract of PLAYER_LIBRARY_CONTRACTS) {
        const sourcePath = path.join(projectRoot, contract.source);
        try {
            const discoveredFiles = extractLibraryUrls(await readFile(sourcePath, 'utf8'));
            const expectedFiles = [ ...contract.files ].sort();
            playerLibraryReferences[contract.source] = discoveredFiles;
            if (JSON.stringify(discoveredFiles) !== JSON.stringify(expectedFiles)) {
                errors.push(
                    `${contract.source} library URLs ${JSON.stringify(discoveredFiles)} `
                    + `do not match expected ${JSON.stringify(expectedFiles)}`
                );
            }
            for (const fileName of discoveredFiles) {
                await checkFile(
                    path.join(resolvedDistDirectory, 'libraries', fileName),
                    errors,
                    `${contract.source} target libraries/${fileName}`
                );
            }
        } catch (error) {
            errors.push(`cannot inspect ${contract.source}: ${error.message}`);
        }
    }

    let serviceWorker = {
        directImports: [],
        importsSharedApplicationChunks: false,
        pageScriptReference: false,
        usesWebpackRuntime: false,
        webpackSharedChunkIds: []
    };
    const serviceWorkerPath = path.join(resolvedDistDirectory, 'serviceworker.js');
    if (await pathExists(serviceWorkerPath)) {
        serviceWorker = {
            ...extractServiceWorkerDependencies(await readFile(serviceWorkerPath, 'utf8')),
            pageScriptReference: references.some(reference => (
                reference.kind === 'script'
                && reference.relativePath === 'serviceworker.js'
            ))
        };
    }

    const baselineExceptions = [
        {
            active: serviceWorker.pageScriptReference,
            id: 'webpack-service-worker-page-script',
            removeIn: 'PR 5',
            summary: 'Webpack injects serviceworker.js into index.html as a page script.'
        }
    ];
    if (serviceWorker.pageScriptReference) {
        warnings.push('baseline exception active: serviceworker.js is referenced as a page script');
    }
    if (serviceWorker.importsSharedApplicationChunks) {
        warnings.push('serviceworker.js depends on shared application/runtime chunks');
    }

    return {
        schemaVersion: 1,
        status: errors.length ? 'failed' : 'passed',
        distDirectory: path.relative(projectRoot, resolvedDistDirectory) || '.',
        stableOutputs: {
            directories: STABLE_DIRECTORIES,
            rootFiles: STABLE_ROOT_FILES,
            copiedAssetCount: sourceAssetFiles.length,
            copiedFaviconFiles: faviconFiles,
            copiedLibraryFiles: LIBRARY_FILES
        },
        html: {
            references
        },
        themes: {
            configuredIds: themeIds
        },
        manifest: {
            icons: manifestIcons
        },
        libraries: {
            playerReferences: playerLibraryReferences
        },
        serviceWorker,
        baselineExceptions,
        warnings,
        errors
    };
};
/* eslint-enable sonarjs/cognitive-complexity */

const printHumanReport = report => {
    console.log(`Build output audit: ${report.status.toUpperCase()}`);
    console.log(`HTML references checked: ${report.html.references.length}`);
    console.log(`Configured themes checked: ${report.themes.configuredIds.length}`);
    console.log(`Stable assets checked: ${report.stableOutputs.copiedAssetCount}`);
    console.log(`Service worker referenced by page: ${report.serviceWorker.pageScriptReference}`);
    console.log(`Service worker uses shared chunks: ${report.serviceWorker.importsSharedApplicationChunks}`);

    for (const warning of report.warnings) console.warn(`WARNING: ${warning}`);
    for (const error of report.errors) console.error(`ERROR: ${error}`);
};

const isMainModule = process.argv[1]
    && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
    const report = await auditBuildOutput();
    if (process.argv.includes('--json')) {
        console.log(JSON.stringify(report, null, 2));
    } else {
        printHumanReport(report);
    }
    if (report.errors.length) process.exitCode = 1;
}
