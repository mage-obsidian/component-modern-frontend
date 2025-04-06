import {defineConfig} from 'vite';
import "mage-obsidian/service/setupGlobals.js";
import vue from '@vitejs/plugin-vue';
import themeResolver from "mage-obsidian/service/themeResolverSync.cjs";
import configResolver from "mage-obsidian/service/configResolver.cjs";
import {OUTPUT_CSS_DIR, PRECOMPILED_FOLDER} from 'mage-obsidian/config/default.cjs';
import moduleResolver from "mage-obsidian/service/moduleResolver.js"
import inheritModuleResolver from 'mage-obsidian/service/inheritModuleResolver.js'
import inheritAssetsModuleResolver from 'mage-obsidian/service/inheritAssetsModuleResolver.js'
import preCompileMagentoFiles from 'mage-obsidian/service/preCompileMagentoFiles.js';
import magentoHrmRewrite from "mage-obsidian/service/magentoHrmRewrite.js";
import defaultNodeResolve from 'mage-obsidian/service/defaultNodeResolver.js';
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
const rootViteDir = path.resolve(__dirname);
process.env.NODE_PATH = path.resolve(rootViteDir, 'node_modules/');
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


console.log(rootViteDir);

export default defineConfig(async () => {
    await preCompileMagentoFiles(CURRENT_THEME);
    const themeConfig = themeResolver.getThemeConfig(CURRENT_THEME);
    const inputs = await moduleResolver.getAllJsVueFilesWithInheritanceCached(CURRENT_THEME);
    inputs[resolveLibPath('vue')] = `${PRECOMPILED_FOLDER}/${CURRENT_THEME}/precompiled.js`;

    if (themeConfig.exposeNpmPackages) {
        themeConfig.exposeNpmPackages.forEach((lib) => {
            inputs[resolveLibPath(lib.exposePath)] = MODE === 'production' ? lib.package : resolveNodePath(lib.exposePath);
        })
    }
    return {
        root: rootViteDir,
        base: rootViteDir,
        plugins: [
            inheritModuleResolver(),
            inheritAssetsModuleResolver(),
            vue(),
            magentoHrmRewrite(),
            defaultNodeResolve,
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
            },
            outDir: outputDir,
            emptyOutDir: true,
            ssr: false,
        },
        resolve: {
            alias: {
                vue: aliasVueFileName,
                '@NODE/': path.resolve(rootViteDir, 'node_modules/'),
            }
        },
        server: {
            host: process.env.VITE_SERVER_HOST,
            port: process.env.VITE_SERVER_PORT,
            fs: {
                allow: [
                    rootDir
                ],
            },
            hmr: {
                host: process.env.MAGENTO_HOST,
                protocol: process.env.VITE_SERVER_SECURE ? 'wss' : 'ws',
                path: process.env.VITE_HMR_PATH,
            }
        },
        appType: 'mpa'
    }
});
