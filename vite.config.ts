/// <reference types="vitest" />
/// <reference types="vite/client" />
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';

import packageJson from './package.json';

let COMMIT_SHA = '';

type ErrorEntry = {
    id: number;
    message: string;
    stack?: string;
    timestamp: string;
    type: string;
};
try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    COMMIT_SHA = execSync('git describe --always --dirty').toString().trim();
} catch {
    // Ignore
}

const serviceWorkerManifestPlugin = {
    name: 'service-worker-manifest',
    enforce: 'post' as const,
    buildEnd() {
        const manifest = {
            version: COMMIT_SHA || Date.now().toString(36),
            timestamp: Date.now(),
            buildId: process.env.JELLYFIN_VERSION || 'dev'
        };
        const manifestPath = path.resolve(__dirname, 'dist/web/sw-manifest.json');
        fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        // eslint-disable-next-line no-console
        console.log(`[ServiceWorker] Generated manifest at ${manifestPath}`);
    }
};

const serviceWorkerManifestDevPlugin = {
    name: 'service-worker-manifest-dev',
    configureServer(server) {
        server.middlewares.use('/sw-manifest.json', (req, res) => {
            const manifest = {
                version: 'dev-' + Date.now().toString(36),
                timestamp: Date.now(),
                buildId: 'development'
            };
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(manifest));
        });
    }
};

const Assets = [
    'libarchive.js/dist/worker-bundle.js',
    'libarchive.js/dist/libarchive.wasm',
    '@jellyfin/libass-wasm/dist/js/default.woff2',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    'pdfjs-dist/build/pdf.worker.mjs',
    'libpgs/dist/libpgs.worker.js'
];

const DEV_PROXY_BASE_PATH = '/__proxy__/jellyfin';
const DEV_CONFIG_PATH = path.resolve(__dirname, 'dev/dev-config.json');
const DEFAULT_DEV_CONFIG = {
    serverBaseUrl: '',
    useProxy: false,
    proxyBasePath: DEV_PROXY_BASE_PATH
};

function readDevConfigFile() {
    try {
        if (!fs.existsSync(DEV_CONFIG_PATH)) {
            fs.mkdirSync(path.dirname(DEV_CONFIG_PATH), { recursive: true });
            fs.writeFileSync(DEV_CONFIG_PATH, JSON.stringify(DEFAULT_DEV_CONFIG, null, 2));
        }
        const raw = fs.readFileSync(DEV_CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_DEV_CONFIG, ...parsed };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[DevConfig] Failed to read dev-config.json', error);
        return { ...DEFAULT_DEV_CONFIG };
    }
}

function writeDevConfigFile(nextConfig) {
    const sanitized = {
        serverBaseUrl: typeof nextConfig.serverBaseUrl === 'string' ? nextConfig.serverBaseUrl : undefined,
        useProxy: typeof nextConfig.useProxy === 'boolean' ? nextConfig.useProxy : undefined,
        proxyBasePath: typeof nextConfig.proxyBasePath === 'string' ? nextConfig.proxyBasePath : undefined
    };
    const merged = { ...readDevConfigFile(), ...sanitized };
    fs.mkdirSync(path.dirname(DEV_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(DEV_CONFIG_PATH, JSON.stringify(merged, null, 2));
    return merged;
}

function createProxyConfig(env, devMode) {
    let target = devMode ? env.VITE_DEV_JELLYFIN_TARGET : undefined;

    if (devMode && !target) {
        const devConfig = readDevConfigFile();
        if (devConfig.useProxy && devConfig.serverBaseUrl) {
            target = devConfig.serverBaseUrl;
        }
    }

    if (!devMode || !target) {
        return undefined;
    }

    return {
        [DEV_PROXY_BASE_PATH]: {
            target,
            changeOrigin: true,
            secure: false,
            ws: true,
            rewrite: proxyPath => proxyPath.replace(DEV_PROXY_BASE_PATH, '')
        }
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const devMode = mode === 'development';
    return {
        base: './',
        root: 'src',
        publicDir: '../public',
        server: {
            proxy: createProxyConfig(env, devMode)
        },
        optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client'] },
        build: {
            target: 'es2022',
            outDir: '../dist',
            emptyOutDir: true,
            sourcemap: 'hidden',
            commonjsOptions: { transformMixedEsModules: true, include: [/node_modules/] },
            rollupOptions: {
                input: { main: path.resolve(__dirname, 'src/index.html') },
                output: {
                    assetFileNames: 'assets/[name]-[hash][extname]',
                    chunkFileNames: 'assets/[name]-[hash].js',
                    entryFileNames: 'assets/[name]-[hash].js',
                    manualChunks(id) {
                        if (!id.includes('node_modules')) {
                            return undefined;
                        }

                        if (id.includes('three') || id.includes('@react-three')) {
                            return 'vendor-graphics';
                        }

                        if (id.includes('butterchurn')) {
                            return 'vendor-visualizers';
                        }

                        if (id.includes('hls.js') || id.includes('flv.js') || id.includes('wavesurfer.js')) {
                            return 'vendor-media';
                        }

                        if (id.includes('epubjs') || id.includes('pdfjs-dist') || id.includes('libarchive.js')) {
                            return 'vendor-docs';
                        }

                        if (id.includes('@jellyfin/libass-wasm') || id.includes('libpgs')) {
                            return 'vendor-subtitles';
                        }

                        if (
                            id.includes('lodash-es') ||
                            id.includes('date-fns') ||
                            id.includes('dompurify') ||
                            id.includes('markdown-it')
                        ) {
                            return 'vendor-utils';
                        }

                        if (
                            id.includes('react') ||
                            id.includes('react-dom') ||
                            id.includes('react-router-dom') ||
                            id.includes('@tanstack/react-query') ||
                            id.includes('zustand') ||
                            id.includes('motion')
                        ) {
                            return 'vendor-framework';
                        }

                        if (id.includes('core-js')) {
                            return 'vendor-corejs';
                        }

                        if (id.includes('@jellyfin/sdk') || id.includes('jellyfin-apiclient')) {
                            return 'vendor-jellyfin';
                        }

                        if (id.includes('swiper') || id.includes('jstree') || id.includes('sortablejs')) {
                            return 'vendor-ui-libs';
                        }

                        return 'vendor';
                    }
                }
            }
        },
        resolve: { alias: {} },
        define: {
            __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
            __JF_BUILD_VERSION__: JSON.stringify(process.env.JELLYFIN_VERSION || 'Release'),
            __PACKAGE_JSON_NAME__: JSON.stringify(packageJson.name),
            __PACKAGE_JSON_VERSION__: JSON.stringify(packageJson.version),
            __USE_SYSTEM_FONTS__: JSON.stringify(false),
            __DEV_SERVER_PROXY_TARGET__: JSON.stringify(env.VITE_DEV_JELLYFIN_TARGET || ''),
            'process.env.NODE_ENV': JSON.stringify(mode)
        },
        plugins: [
            vanillaExtractPlugin(),
            react(),
            tsconfigPaths({ root: '..' }),
            serviceWorkerManifestPlugin,
            ...(devMode
                ? [
                      {
                          name: 'dev-config',
                          configureServer(server) {
                              server.middlewares.use('/__dev-config', (req, res) => {
                                  res.setHeader('Content-Type', 'application/json');
                                  res.setHeader('Cache-Control', 'no-store');
                                  res.setHeader('Access-Control-Allow-Origin', '*');
                                  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
                                  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                                  if (req.method === 'OPTIONS') {
                                      res.writeHead(204);
                                      res.end();
                                      return;
                                  }

                                  if (req.method === 'GET') {
                                      res.end(JSON.stringify(readDevConfigFile()));
                                      return;
                                  }

                                  if (req.method === 'PUT') {
                                      let body = '';
                                      req.on('data', chunk => {
                                          body += chunk;
                                      });
                                      req.on('end', () => {
                                          try {
                                              const parsed = body ? JSON.parse(body) : {};
                                              const updated = writeDevConfigFile(parsed);
                                              res.end(JSON.stringify(updated));
                                          } catch {
                                              res.statusCode = 400;
                                              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                                          }
                                      });
                                      return;
                                  }

                                  res.statusCode = 405;
                                  res.end(JSON.stringify({ error: 'Method not allowed' }));
                              });
                          }
                      },
                      serviceWorkerManifestDevPlugin,
                      {
                          name: 'error-monitor',
                          configureServer(server) {
                              let errorLog: ErrorEntry[] = [];
                              let errorCount = 0;
                              server.middlewares.use('/__error-monitor/api/errors', (req, res) => {
                                  res.setHeader('Content-Type', 'application/json');
                                  res.setHeader('Access-Control-Allow-Origin', '*');
                                  if (req.method === 'OPTIONS') {
                                      res.writeHead(204);
                                      res.end();
                                      return;
                                  }
                                  const url = new URL(req.url || '', `http://${req.headers.host}`);
                                  const action = url.searchParams.get('action');
                                  if (action === 'clear') {
                                      errorLog = [] as ErrorEntry[];
                                      errorCount = 0;
                                      res.writeHead(200);
                                      res.end(JSON.stringify({ success: true }));
                                      return;
                                  }
                                  const since = url.searchParams.get('since');
                                  let errors = errorLog;
                                  if (since) {
                                      const sinceTime = parseInt(since, 10);
                                      errors = errorLog.filter(e => new Date(e.timestamp).getTime() > sinceTime);
                                  }
                                  res.writeHead(200);
                                  res.end(JSON.stringify({ count: errorCount, errors }));
                              });
                              server.middlewares.use('/__error-monitor/event', (req, res) => {
                                  res.setHeader('Content-Type', 'text/event-stream');
                                  res.setHeader('Cache-Control', 'no-cache');
                                  res.setHeader('Connection', 'keep-alive');
                                  res.setHeader('Access-Control-Allow-Origin', '*');
                                  res.write('retry: 1000\n\n');
                                  const sendEvent = (data: ErrorEntry) =>
                                      res.write(`event: error\ndata: ${JSON.stringify(data)}\n\n`);
                                  const since = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get(
                                      'since'
                                  );
                                  const sinceTime = since ? parseInt(since, 10) : 0;
                                  errorLog.filter(e => new Date(e.timestamp).getTime() > sinceTime).forEach(sendEvent);
                                  const captureError = (error: unknown, type: string) => {
                                      const entry: ErrorEntry = {
                                          id: ++errorCount,
                                          message: String(error instanceof Error ? error.message : error),
                                          stack: error instanceof Error ? error.stack : undefined,
                                          timestamp: new Date().toISOString(),
                                          type
                                      };
                                      errorLog.push(entry);
                                      if (errorLog.length > 1000) errorLog.shift();
                                      sendEvent(entry);
                                  };
                                  global.__errorMonitorListeners = global.__errorMonitorListeners || new Set();
                                  const listener = event =>
                                      captureError(
                                          event.detail?.error || event.detail?.message,
                                          event.detail?.type || 'ERROR'
                                      );
                                  global.__errorMonitorListeners.add(listener);
                                  req.on('close', () => global.__errorMonitorListeners?.delete(listener));
                              });
                          }
                      }
                  ]
                : []),
            viteStaticCopy({
                targets: [
                    { src: 'assets', dest: '.' },
                    { src: 'config.json', dest: '.' },
                    { src: 'robots.txt', dest: '.' },
                    { src: 'offline.html', dest: '.' },
                    ...(!devMode ? [{ src: 'serviceworker.backup.js', dest: '.', rename: 'serviceworker.js' }] : []),
                    { src: '../node_modules/@jellyfin/ux-web/favicons/touchicon*.png', dest: 'favicons' },
                    {
                        src: '../node_modules/@jellyfin/ux-web/banner-light.png',
                        dest: 'favicons',
                        rename: 'banner.png'
                    },
                    ...Assets.map(asset => ({ src: `../node_modules/${asset}`, dest: 'libraries' }))
                ]
            })
        ],
        test: {
            globals: true,
            environment: 'jsdom',
            restoreMocks: true,
            setupFiles: ['./src/vitest.setup.ts'],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html', 'lcov'],
                include: ['src/**/*.{ts,tsx}'],
                exclude: [
                    'src/**/*.d.ts',
                    'src/**/*.test.{ts,tsx}',
                    'src/**/*.stories.{ts,tsx}',
                    'src/vitest.setup.ts'
                ],
                // Code quality standards with incremental improvement roadmap
                // Baseline established Jan 2025: Lines 28%, Functions 23%, Branches 24%, Statements 28%
                //
                // PHASED COVERAGE TARGETS (strict yet achievable):
                //
                // ✓ PHASE 1 - Foundation (Current baseline, prevents regression):
                //   Lines: 28% | Functions: 23% | Branches: 24% | Statements: 28%
                //   - Establishes minimum acceptable coverage
                //   - Prevents test coverage from decreasing
                //   - Focus: Core utilities, critical paths, essential components
                //
                // • PHASE 2 - Consolidation (Target: Q1 2025):
                //   Lines: 40% | Functions: 35% | Branches: 35% | Statements: 40%
                //   - Expand tests to secondary modules
                //   - Improve edge case coverage
                //   - Focus: Store, hooks, middleware, helpers
                //
                // • PHASE 3 - Maturation (Target: Q2 2025):
                //   Lines: 55% | Functions: 50% | Branches: 50% | Statements: 55%
                //   - Good coverage on most modules
                //   - Strong confidence in refactoring safety
                //   - Industry-acceptable standard for production code
                //
                // • PHASE 4 - Excellence (Target: Q3-Q4 2025):
                //   Lines: 70% | Functions: 70% | Branches: 65% | Statements: 70%
                //   - Comprehensive test coverage
                //   - Excellent edge case handling
                //   - High confidence in code quality
                //
                // • PHASE 5 - Mastery (Aspirational):
                //   Lines: 80%+ | Functions: 80%+ | Branches: 75%+ | Statements: 80%+
                //   - Excellence in all metrics
                //   - Minimal untested code paths
                //
                // GUIDELINES for improving coverage:
                // 1. Focus on high-value code first (utils, stores, hooks)
                // 2. Test happy paths, error paths, and edge cases
                // 3. Use code coverage reports (npm run test:coverage) to identify gaps
                // 4. Update thresholds monthly to reflect progress
                thresholds: {
                    global: {
                        lines: 28,
                        functions: 23,
                        branches: 24,
                        statements: 28
                    }
                }
            }
        }
    };
});
