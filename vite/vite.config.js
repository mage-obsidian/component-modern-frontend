import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import themeResolver from "mage-obsidian/core/themeResolverSync.ts";
import configResolver from "mage-obsidian/core/configResolver.ts";
import {OUTPUT_CSS_DIR, PRECOMPILED_FOLDER} from 'mage-obsidian/config/default.ts';
import moduleResolver from "mage-obsidian/core/moduleResolver.ts"
import {getResolverPlugins, ensurePrecompiled, getFsAllowList} from 'mage-obsidian/vite/sharedPlugins.ts';
import themeSourceWatcher from "mage-obsidian/vite/themeSourceWatcher.ts";
import magentoHrmRewrite from "mage-obsidian/vite/magentoHrmRewrite.ts";
import path from "path";
import dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite'

dotenv.config();

const CURRENT_THEME = process.env.CURRENT_THEME;

let currentTheme = configResolver.getThemeDefinition(CURRENT_THEME);

let vueFileExt = (process.env.NODE_ENV !== 'production') ? '.js' : '.prod.js';

let vueFileName = 'vue.esm-browser' + vueFileExt;
let aliasVueFileName = `vue/dist/${vueFileName}`
const outputDir = configResolver.getOutputDirFromTheme(currentTheme.src);

const rootDir = path.resolve(__dirname, '..');
const LIB_PATH = configResolver.getMagentoConfig().LIB_PATH;
const MODE = process.env.NODE_ENV;

function resolveLibPath(lib) {
    return path.join(LIB_PATH, lib);
}

function resolveNodePath(packageName) {
    try {
        const resolvedPath = import.meta.resolve(packageName);
        return resolvedPath.replace('file://', '');
    } catch (error) {
        console.error(`No se pudo resolver el paquete: ${packageName}`);
        throw error;
    }
}

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
    const exposedAlias = {vue: aliasVueFileName};
    if (themeConfig.exposeNpmPackages) {
        themeConfig.exposeNpmPackages.forEach((lib) => {
            inputs[resolveLibPath(lib.exposePath)] = MODE === 'production' ? lib.package : resolveNodePath(lib.exposePath);
            exposedAlias[lib.package] = resolveNodePath(lib.exposePath);
        })
    }
    return {
        root: './',
        base: './',
        plugins: [
            ...getResolverPlugins(),
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
                host: process.env.MAGENTO_HOST,
                protocol: VITE_SERVER_SECURE ? 'wss' : 'ws',
                path: process.env.VITE_HMR_PATH,
            }
        },
        appType: 'mpa'
    }
});
