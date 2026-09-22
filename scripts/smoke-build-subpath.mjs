#!/usr/bin/env node

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
    auditBuildOutput,
    LIBRARY_FILES
} from './audit-build-output.mjs';

const FIXTURE_PREFIX = '/web/';

const CONTENT_TYPES = new Map([
    [ '.css', 'text/css; charset=utf-8' ],
    [ '.html', 'text/html; charset=utf-8' ],
    [ '.ico', 'image/x-icon' ],
    [ '.js', 'text/javascript; charset=utf-8' ],
    [ '.json', 'application/json; charset=utf-8' ],
    [ '.png', 'image/png' ],
    [ '.svg', 'image/svg+xml' ],
    [ '.wasm', 'application/wasm' ],
    [ '.woff2', 'font/woff2' ]
]);

const isPathInside = (parent, child) => {
    const relativePath = path.relative(parent, child);
    return relativePath === '' || (
        !relativePath.startsWith(`..${path.sep}`)
        && relativePath !== '..'
        && !path.isAbsolute(relativePath)
    );
};

const listFiles = async directory => {
    const { readdir } = await import('node:fs/promises');
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

const createFixtureServer = distDirectory => createServer(async (request, response) => {
    try {
        // eslint-disable-next-line sonarjs/no-clear-text-protocols -- Synthetic URL for a loopback-only fixture.
        const requestUrl = new URL(request.url, 'http://fixture.invalid');
        if (!requestUrl.pathname.startsWith(FIXTURE_PREFIX)) {
            response.writeHead(404).end();
            return;
        }

        let relativePath;
        try {
            relativePath = decodeURIComponent(requestUrl.pathname.slice(FIXTURE_PREFIX.length));
        } catch {
            response.writeHead(400).end();
            return;
        }
        if (!relativePath) relativePath = 'index.html';

        const absolutePath = path.resolve(distDirectory, relativePath);
        if (!isPathInside(distDirectory, absolutePath)) {
            response.writeHead(403).end();
            return;
        }

        const fileStats = await stat(absolutePath);
        if (!fileStats.isFile()) {
            response.writeHead(404).end();
            return;
        }

        response.writeHead(200, {
            'content-length': fileStats.size,
            'content-type': CONTENT_TYPES.get(path.extname(absolutePath).toLowerCase())
                || 'application/octet-stream'
        });
        if (request.method === 'HEAD') {
            response.end();
        } else {
            createReadStream(absolutePath).pipe(response);
        }
    } catch {
        response.writeHead(404).end();
    }
});

const fetchChecked = async (url, { method = 'GET', expectedType } = {}) => {
    const response = await fetch(url, { method });
    if (!response.ok) throw new Error(`${method} ${url} returned ${response.status}`);
    if (expectedType && !response.headers.get('content-type')?.startsWith(expectedType)) {
        throw new Error(
            `${method} ${url} returned content-type ${response.headers.get('content-type')}, `
            + `expected ${expectedType}`
        );
    }
    return response;
};

const mapWithConcurrency = async (values, concurrency, callback) => {
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
        while (nextIndex < values.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            await callback(values[currentIndex]);
        }
    });
    await Promise.all(workers);
};

const extractCssUrls = css => {
    const urls = [];
    // eslint-disable-next-line sonarjs/slow-regex -- Input is trusted CSS emitted by the local build.
    const pattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/g;
    let match;
    while ((match = pattern.exec(css))) {
        const value = (match[1] ?? match[2] ?? match[3] ?? '').trim();
        if (value && !value.startsWith('data:') && !value.startsWith('#')) urls.push(value);
    }
    return urls;
};

export const runSubpathSmoke = async ({
    projectRoot = process.cwd(),
    distDirectory = path.join(projectRoot, 'dist')
} = {}) => {
    const resolvedDistDirectory = path.resolve(distDirectory);
    const audit = await auditBuildOutput({ projectRoot, distDirectory: resolvedDistDirectory });
    if (audit.errors.length) {
        throw new Error(`cannot run subpath smoke test because the output audit failed:\n${audit.errors.join('\n')}`);
    }

    const server = createFixtureServer(resolvedDistDirectory);
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const baseUrl = `${origin}${FIXTURE_PREFIX}`;
    const failures = [];
    const checked = {
        htmlReferences: 0,
        lazyChunks: 0,
        manifestIcons: 0,
        themeAssets: 0,
        themes: 0,
        workersAndLibraries: 0
    };

    const attempt = async callback => {
        try {
            await callback();
        } catch (error) {
            failures.push(error.message);
        }
    };

    try {
        const indexUrl = `${baseUrl}index.html`;
        await attempt(async () => {
            await fetchChecked(baseUrl, { expectedType: 'text/html' });
            await fetchChecked(indexUrl, { expectedType: 'text/html' });
        });

        for (const reference of audit.html.references) {
            await attempt(async () => {
                const resolvedUrl = new URL(reference.url, indexUrl);
                if (!resolvedUrl.pathname.startsWith(FIXTURE_PREFIX)) {
                    throw new Error(
                        `index ${reference.kind} reference escapes ${FIXTURE_PREFIX}: ${reference.url}`
                    );
                }
                await fetchChecked(resolvedUrl, { method: 'HEAD' });
                checked.htmlReferences += 1;
            });
        }

        const outputFiles = await listFiles(resolvedDistDirectory);
        const lazyChunks = outputFiles.filter(relativePath => (
            /\.chunk\.(?:js|css)$/.test(relativePath)
            || /(?:^|[.-])legacy[.-].*\.js$/.test(relativePath)
        ));
        await mapWithConcurrency(lazyChunks, 32, async relativePath => {
            await attempt(async () => {
                await fetchChecked(new URL(relativePath.replaceAll(path.sep, '/'), baseUrl), {
                    method: 'HEAD'
                });
                checked.lazyChunks += 1;
            });
        });

        await attempt(async () => {
            const configResponse = await fetchChecked(`${baseUrl}config.json`, {
                expectedType: 'application/json'
            });
            const config = await configResponse.json();
            const servedThemeIds = config.themes?.map(theme => theme.id).sort();
            const expectedThemeIds = [ ...audit.themes.configuredIds ].sort();
            if (JSON.stringify(servedThemeIds) !== JSON.stringify(expectedThemeIds)) {
                throw new Error('served config.json theme IDs do not match the audited source configuration');
            }
        });

        for (const themeId of audit.themes.configuredIds) {
            await attempt(async () => {
                const themeUrl = new URL(`themes/${themeId}/theme.css`, baseUrl);
                const response = await fetchChecked(themeUrl, { expectedType: 'text/css' });
                const css = await response.text();
                checked.themes += 1;

                for (const assetUrl of extractCssUrls(css)) {
                    const resolvedAssetUrl = new URL(assetUrl, themeUrl);
                    if (resolvedAssetUrl.origin !== origin) continue;
                    if (!resolvedAssetUrl.pathname.startsWith(FIXTURE_PREFIX)) {
                        throw new Error(
                            `theme ${themeId} asset escapes ${FIXTURE_PREFIX}: ${assetUrl}`
                        );
                    }
                    await fetchChecked(resolvedAssetUrl, { method: 'HEAD' });
                    checked.themeAssets += 1;
                }
            });
        }

        await attempt(async () => {
            const manifestUrl = new URL('manifest.json', baseUrl);
            const response = await fetchChecked(manifestUrl, {
                expectedType: 'application/json'
            });
            const manifest = await response.json();
            if (!Array.isArray(manifest.icons)) throw new Error('served manifest has no icons array');

            for (const icon of manifest.icons) {
                const iconUrl = new URL(icon.src, manifestUrl);
                if (!iconUrl.pathname.startsWith(FIXTURE_PREFIX)) {
                    throw new Error(`manifest icon escapes ${FIXTURE_PREFIX}: ${icon.src}`);
                }
                await fetchChecked(iconUrl, { method: 'HEAD' });
                checked.manifestIcons += 1;
            }
        });

        const workerAndLibraryFiles = [ 'serviceworker.js', ...LIBRARY_FILES ];
        for (const relativePath of workerAndLibraryFiles) {
            await attempt(async () => {
                const url = relativePath === 'serviceworker.js' ?
                    new URL(relativePath, baseUrl) :
                    new URL(`libraries/${relativePath}`, baseUrl);
                await fetchChecked(url, { method: 'HEAD' });
                checked.workersAndLibraries += 1;
            });
        }
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }

    return {
        schemaVersion: 1,
        status: failures.length ? 'failed' : 'passed',
        prefix: FIXTURE_PREFIX,
        checked,
        failures
    };
};

const isMainModule = process.argv[1]
    && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
    const report = await runSubpathSmoke();
    if (process.argv.includes('--json')) {
        console.log(JSON.stringify(report, null, 2));
    } else {
        console.log(`Subpath smoke test: ${report.status.toUpperCase()}`);
        console.log(`Fixture prefix: ${report.prefix}`);
        console.log(`HTML references checked: ${report.checked.htmlReferences}`);
        console.log(`Lazy chunks checked: ${report.checked.lazyChunks}`);
        console.log(`Themes checked: ${report.checked.themes}`);
        console.log(`Manifest icons checked: ${report.checked.manifestIcons}`);
        console.log(`Workers/libraries checked: ${report.checked.workersAndLibraries}`);
        for (const failure of report.failures) console.error(`ERROR: ${failure}`);
    }
    if (report.failures.length) process.exitCode = 1;
}
