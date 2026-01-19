/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";
import fs from "fs";
import { globSync } from "fast-glob";
import { execSync } from "child_process";
import packageJson from "./package.json";

// Get commit SHA
let COMMIT_SHA = "";
try {
    COMMIT_SHA = execSync("git describe --always --dirty").toString().trim();
} catch (err) {
    // Ignore
}

// Plugin to handle HTML template imports as raw text (Webpack html-loader compatibility)
const htmlAsStringPlugin: Plugin = {
    name: 'html-as-string',
    enforce: 'pre',
    async resolveId(id, importer) {
        // Only transform .html files that are not the main entry point (src/index.html)
        if (id.endsWith('.html')) {
            const res = await this.resolve(id, importer, { skipSelf: true });
            if (res) {
                // Skip the main index.html entry point
                const isMainEntry = res.id.endsWith('src/index.html') || res.id.endsWith('src\\index.html');
                if (!isMainEntry) {
                    return res.id + '?html-string';
                }
            }
        }
    },
    load(id: string) {
        if (id.endsWith('?html-string')) {
            const file = id.replace('?html-string', '');
            const code = fs.readFileSync(file, 'utf-8');
            return `export default ${JSON.stringify(code)};`;
        }
    },
};

// Plugin to fix escape-html CommonJS to ESM conversion
const escapeHtmlPlugin: Plugin = {
    name: 'escape-html-fix',
    enforce: 'pre' as const,
    load(id) {
        if (id.includes('escape-html') && !id.includes('.ts')) {
            return fs.readFileSync(path.resolve(process.cwd(), 'src/utils/escape-html-shim.js'), 'utf-8');
        }
    }
};

// Plugin to handle Webpack-style '~' prefix in CSS imports
const scssTildePlugin: Plugin = {
    name: "scss-tilde-import",
    enforce: "pre",
    resolveId(source) {
        if (source.startsWith("~@fontsource")) {
            return source.replace("~", "");
        }
    },
};

// Plugin to serve compiled theme CSS in development mode
const themeDevPlugin: Plugin = {
    name: "theme-dev-server",
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            // Match requests like /themes/dark/theme.css
            const match = req.url?.match(/^\/themes\/([^/]+)\/theme\.css/);
            if (match) {
                const themeId = match[1];
                const scssPath = path.resolve(__dirname, `src/themes/${themeId}/theme.scss`);

                if (fs.existsSync(scssPath)) {
                    try {
                        // Use Vite's internal SCSS processing
                        const result = await server.transformRequest(`/themes/${themeId}/theme.scss`);
                        if (result && typeof result.code === 'string') {
                            // Extract CSS from the transformed result
                            // Vite wraps CSS in JS for HMR, we need to extract the raw CSS
                            res.setHeader('Content-Type', 'text/css');

                            // The CSS is embedded in a JS module, extract it
                            const cssMatch = result.code.match(/__vite__css\s*=\s*"([^"]*)"/s);
                            if (cssMatch) {
                                // Unescape the CSS string
                                const css = cssMatch[1]
                                    .replace(/\\n/g, '\n')
                                    .replace(/\\"/g, '"')
                                    .replace(/\\\\/g, '\\');
                                res.end(css);
                                return;
                            }
                        }
                        // Fallback: compile SCSS directly
                        const sass = await import('sass');
                        const compiled = sass.compile(scssPath, {
                            loadPaths: [
                                path.resolve(__dirname, 'src'),
                                path.resolve(__dirname, 'node_modules')
                            ]
                        });
                        res.setHeader('Content-Type', 'text/css');
                        res.end(compiled.css);
                        return;
                    } catch (e) {
                        console.error(`Failed to compile theme ${themeId}:`, e);
                    }
                }
            }
            next();
        });
    }
};

const Assets = [
    "native-promise-only/npo.js",
    "libarchive.js/dist/worker-bundle.js",
    "libarchive.js/dist/libarchive.wasm",
    "@jellyfin/libass-wasm/dist/js/default.woff2",
    "@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js",
    "@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm",
    "@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js",
    "pdfjs-dist/build/pdf.worker.mjs",
    "libpgs/dist/libpgs.worker.js",
];

// Find themes
const themeEntries = globSync("src/themes/**/*.scss").reduce(
    (acc, file) => {
        // src/themes/dark/theme.scss -> themes/dark/theme
        const relativePath = path.relative("src", file);
        const entryName = relativePath.replace(/\.scss$/, "");
        acc[entryName] = path.resolve(__dirname, file);
        return acc;
    },
    {} as Record<string, string>,
);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        base: env.VITE_BASE || "./", // Default to relative for flexibility, or override via env
        root: "src", // Webpack context was 'src'
        publicDir: false, // We handle static assets manually to match Webpack structure
        server: {
            // Proxy API requests to the Jellyfin server to avoid CORS issues
            proxy: {
                // Proxy all API endpoints
                '/Users': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/System': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/Audio': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/Videos': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/Items': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/Sessions': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/Library': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/DisplayPreferences': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false
                },
                '/socket': {
                    target: env.JELLYFIN_SERVER || 'https://2activedesign.com',
                    changeOrigin: true,
                    secure: false,
                    ws: true
                }
            }
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react-dom/client'],
            exclude: ['escape-html'], // Don't pre-bundle escape-html - we transform it at load time
            esbuildOptions: {
                // Handle HTML imports during dependency scanning
                plugins: [
                    {
                        name: 'html-loader',
                        setup(build) {
                            // Intercept .html imports (except the main src/index.html entry point)
                            build.onResolve({ filter: /\.html$/ }, (args) => {
                                // Skip only the main entry point, not all index.html files
                                const fullPath = path.isAbsolute(args.path)
                                    ? args.path
                                    : path.resolve(args.resolveDir, args.path);
                                const isMainEntry = fullPath.endsWith('src/index.html') || fullPath.endsWith('src\\index.html');
                                if (isMainEntry) return null;
                                return {
                                    path: args.path,
                                    namespace: 'html-template',
                                    pluginData: { resolveDir: args.resolveDir }
                                };
                            });
                            build.onLoad({ filter: /.*/, namespace: 'html-template' }, async (args) => {
                                const fullPath = path.isAbsolute(args.path)
                                    ? args.path
                                    : path.resolve(args.pluginData.resolveDir, args.path);
                                const contents = fs.readFileSync(fullPath, 'utf-8');
                                return {
                                    contents: `export default ${JSON.stringify(contents)};`,
                                    loader: 'js'
                                };
                            });
                        }
                    }
                ]
            }
        },
        build: {
            target: "es2022",
            outDir: "../dist", // Since root is src
            emptyOutDir: true,
            commonjsOptions: {
                transformMixedEsModules: true,
                include: [/node_modules/],
            },
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, "src/index.html"),
                    ...themeEntries,
                },
                output: {
                    assetFileNames: (assetInfo) => {
                        if (
                            assetInfo.name?.endsWith(".css") &&
                            assetInfo.name.includes("themes/")
                        ) {
                            // Output themes as themes/id/theme.css
                            // assetInfo.name might be "themes/dark/theme.css" based on input key
                            return "[name][extname]";
                        }
                        return "assets/[name]-[hash][extname]";
                    },
                    chunkFileNames: "assets/[name]-[hash].js",
                    entryFileNames: (chunkInfo) => {
                        // Themes might generate empty JS files, but we mainly care about CSS
                        if (chunkInfo.name.includes("themes/")) {
                            return "[name].js";
                        }
                        return "assets/[name]-[hash].js";
                    },
                    manualChunks(id) {
                        if (id.includes("node_modules")) {
                            if (id.includes("@mui")) return "vendor-mui";
                            if (
                                id.includes("three") ||
                                id.includes("@react-three")
                            )
                                return "vendor-graphics";
                            if (id.includes("butterchurn"))
                                return "vendor-visualizers";
                            if (
                                id.includes("hls.js") ||
                                id.includes("flv.js") ||
                                id.includes("wavesurfer.js")
                            )
                                return "vendor-media";
                            if (
                                id.includes("epubjs") ||
                                id.includes("pdfjs-dist") ||
                                id.includes("libarchive.js")
                            )
                                return "vendor-docs";
                            if (
                                id.includes("@jellyfin/libass-wasm") ||
                                id.includes("libpgs")
                            )
                                return "vendor-subtitles";
                            if (
                                id.includes("lodash-es") ||
                                id.includes("date-fns") ||
                                id.includes("dompurify") ||
                                id.includes("markdown-it")
                            )
                                return "vendor-utils";
                            if (
                                id.includes("react") ||
                                id.includes("react-dom") ||
                                id.includes("react-router-dom") ||
                                id.includes("@tanstack/react-query") ||
                                id.includes("zustand") ||
                                id.includes("framer-motion")
                            )
                                return "vendor-framework";
                            if (id.includes("core-js")) return "vendor-corejs";
                            if (
                                id.includes("@jellyfin/sdk") ||
                                id.includes("jellyfin-apiclient")
                            )
                                return "vendor-jellyfin";
                            if (
                                id.includes("swiper") ||
                                id.includes("jstree") ||
                                id.includes("sortablejs") ||
                                id.includes("headroom.js")
                            )
                                return "vendor-ui-libs";
                            return "vendor";
                        }
                    },
                },
            },
        },
        resolve: {
            // Remove escape-html alias since we're now using transform approach
            alias: {},
        },
        define: {
            __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
            __JF_BUILD_VERSION__: JSON.stringify(
                process.env.JELLYFIN_VERSION || "Release",
            ),
            __PACKAGE_JSON_NAME__: JSON.stringify(packageJson.name),
            __PACKAGE_JSON_VERSION__: JSON.stringify(packageJson.version),
            __USE_SYSTEM_FONTS__: JSON.stringify(false), // Default
            __WEBPACK_SERVE__: JSON.stringify(mode === "development"),
            __DEV_SERVER_PROXY_TARGET__: JSON.stringify(""),
            "process.env.NODE_ENV": JSON.stringify(mode),
        },
        plugins: [
            react(),
            tsconfigPaths({
                root: "..", // Since vite root is src, tsconfig is in parent
            }),
            htmlAsStringPlugin,
            escapeHtmlPlugin,
            scssTildePlugin,
            themeDevPlugin,
            viteStaticCopy({
                targets: [
                    { src: "assets", dest: "." },
                    { src: "config.json", dest: "." },
                    { src: "robots.txt", dest: "." },
                    { src: "offline.html", dest: "." },
                    ...(mode === "development"
                        ? []
                        : [
                              {
                                  src: "serviceworker.backup.js",
                                  dest: ".",
                                  rename: "serviceworker.js",
                              },
                          ]),
                    {
                        src: "../node_modules/@jellyfin/ux-web/favicons/touchicon*.png",
                        dest: "favicons",
                    },
                    {
                        src: "../node_modules/@jellyfin/ux-web/banner-light.png",
                        dest: "favicons",
                    },
                    ...Assets.map((asset) => ({
                        src: `../node_modules/${asset}`,
                        dest: "libraries",
                    })),
                ],
            }),
        ],
        test: {
            globals: true,
            environment: "jsdom",
            restoreMocks: true,
        },
    };
});
