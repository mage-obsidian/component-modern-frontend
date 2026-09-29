// This file is part of the MageObsidian - ModernFrontend project.
//
// SPDX-FileCopyrightText: 2024 Jeanmarcos Juarez
// SPDX-License-Identifier: MIT
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import themeResolver from "mage-obsidian/core/themeResolverSync.ts";
import configResolver from "mage-obsidian/core/configResolver.ts";
import {OUTPUT_CSS_DIR, PRECOMPILED_FOLDER} from 'mage-obsidian/config/default.ts';
import moduleResolver from "mage-obsidian/core/moduleResolver.ts"
import {getResolverPlugins, ensurePrecompiled, getFsAllowList} from 'mage-obsidian/vite/sharedPlugins.ts';
import themeSourceWatcher from "mage-obsidian/vite/themeSourceWatcher.ts";
import magentoHrmRewrite from "mage-obsidian/vite/magentoHrmRewrite.ts";
import resolveVueAlias from "mage-obsidian/vite/vueAlias.ts";
import path from "path";
import dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite'

dotenv.config();

const CURRENT_THEME = process.env.CURRENT_THEME;

let currentTheme = configResolver.getThemeDefinition(CURRENT_THEME);

const outputDir = configResolver.getOutputDirFromTheme(currentTheme.src);

const rootDir = path.resolve(__dirname, '..');
const MODE = process.env.NODE_ENV;
const { resolveLibPath, resolveNodePath } = configResolver;

// Env vars are strings: 'false' is truthy, so a naive check would always pick
// 'wss'. Treat only explicit truthy tokens as secure.
const VITE_SERVER_SECURE = ['true', '1', 'yes', 'on'].includes(
    String(process.env.VITE_SERVER_SECURE ?? '').trim().toLowerCase()
);

let ALLOWED_HOSTS = [process.env.VITE_SERVER_HOST];
if (process.env.VITE_SERVER_ALLOWED_HOSTS) {
    const extraHosts = process.env.VITE_SERVER_ALLOWED_HOSTS.split(',').map(host => host.trim());
    ALLOWED_HOSTS.push(...extraHosts);
}

// A fixed hmr.host pins the wss connection to one host, so a shared theme served
// on a second website (different host) opens a cross-origin socket. Leaving
// MAGENTO_HOST empty omits hmr.host, letting the Vite client derive it from
// window.location — same-origin HMR per website. Set it only behind a proxy/tunnel
// that needs a fixed public host.
const MAGENTO_HOST = String(process.env.MAGENTO_HOST ?? '').trim();

export default defineConfig(async () => {
    await ensurePrecompiled(CURRENT_THEME);
    const themeConfig = await themeResolver.getThemeConfig(CURRENT_THEME);
    const inputs = await moduleResolver.getAllJsVueFilesWithInheritanceCached(CURRENT_THEME);
    inputs[resolveLibPath('vue')] = `${PRECOMPILED_FOLDER}/${CURRENT_THEME}/precompiled.js`;

    // Exposed packages must resolve from any importer — including JS shipped by
    // a module whose real path is symlinked outside the Magento root's
    // node_modules. Aliasing each to its resolved node path (like vue) makes
    // `import 'pinia'` / '@vueuse/core' work everywhere and resolve to a single
    // shared instance, instead of only resolving from theme-level files.
    const exposedAlias = {
        vue: resolveVueAlias({
            runtimeOnly: themeConfig.vue?.runtimeOnly,
            production: MODE === 'production',
        }),
    };
    if (themeConfig.exposeNpmPackages) {
        themeConfig.exposeNpmPackages.forEach((lib) => {
            inputs[resolveLibPath(lib.exposePath)] = MODE === 'production' ? lib.package : resolveNodePath(lib.exposePath);
            exposedAlias[lib.package] = resolveNodePath(lib.exposePath);
        })
    }
    return {
        root: './',
        base: './',
        // `vite build` always runs with mode=production, so import.meta.env.DEV is
        // false even for a developer-mode storefront. Development-only guards read
        // this instead, off the same signal that picks Vue's dev build.
        define: {
            __MAGE_OBSIDIAN_DEV__: MODE !== 'production',
        },
        plugins: [
            ...getResolverPlugins({ themeName: CURRENT_THEME }),
            themeSourceWatcher(CURRENT_THEME),
            vue(),
            magentoHrmRewrite(),
            {
                name: "@tailwindcss/vite:generate", apply: "build", enforce: "pre", async transform(n, a) {
                    // console.log('transform', n, a);
                    // console.log('tt')
                }
            },
            tailwindcss(),
        ],
        build: {
            cssCodeSplit: false,
            // Emit .vite/manifest.json so the PHP side can resolve each island's
            // static dependency graph and modulepreload it, collapsing the serial
            // import chain (component → customer-data → section-store → store → pinia).
            manifest: true,
            rollupOptions: {
                input: {
                    ...inputs
                },
                output: {
                    format: 'es',
                    entryFileNames: '[name].js',
                    assetFileNames: (chunkInfo) => {
                        if (chunkInfo.name && chunkInfo.name.endsWith('.css')) {
                            return OUTPUT_CSS_DIR + '[name].css';
                        }
                        return '[name].[ext]';
                    }
                },
                preserveEntrySignatures: 'strict',
                // @vueuse/core ships `/* #__PURE__ */` annotations in positions
                // rolldown cannot interpret; it ignores the annotation and the
                // build stays correct. Silence only that upstream noise so our
                // own build warnings remain visible.
                onwarn(warning, defaultHandler) {
                    if (
                        warning.code === 'INVALID_ANNOTATION' &&
                        String(warning.message ?? '').includes('@vueuse')
                    ) {
                        return;
                    }
                    defaultHandler(warning);
                },
            },
            outDir: outputDir,
            emptyOutDir: true,
            ssr: false,
        },
        resolve: {
            alias: exposedAlias
        },
        server: {
            host: process.env.VITE_SERVER_HOST,
            port: process.env.VITE_SERVER_PORT,
            allowedHosts: ALLOWED_HOSTS,
            fs: {
                allow: getFsAllowList(rootDir),
            },
            hmr: {
                ...(MAGENTO_HOST ? { host: MAGENTO_HOST } : {}),
                protocol: VITE_SERVER_SECURE ? 'wss' : 'ws',
                path: process.env.VITE_HMR_PATH,
            }
        },
        appType: 'mpa'
    }
});
