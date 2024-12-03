import {defineConfig} from 'vite';
import "#service/setupGlobals.js";
import vue from '@vitejs/plugin-vue';
import themeResolver from "#service/themeResolverSync.cjs";
import configResolver from "#service/configResolver.cjs";
import { OUTPUT_CSS_DIR, PRECOMPILED_FOLDER } from '#config/default.cjs';
import moduleResolver from "#service/moduleResolver.js"
import inheritModuleResolver from '#service/inheritModuleResolver.js'
import preCompileMagentoFiles from '#service/preCompileMagentoFiles.js';
import magentoHrmRewrite from "#service/magentoHrmRewrite.js";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();

const CURRENT_THEME = process.env.CURRENT_THEME;

let currentTheme = configResolver.getThemeDefinition(CURRENT_THEME);

let vueFileExt = (process.env.NODE_ENV !== 'production') ? '.js' : '.prod.js';
let vueFileName = 'vue.esm-browser' + vueFileExt;
let alisVueFileName = `vue/dist/${vueFileName}`

const outputDir = configResolver.getOutputDirFromTheme(currentTheme.src);
const rootDir = path.resolve(__dirname, '..');
const LIB_PATH = configResolver.getMagentoConfig().LIB_PATH;

function resolveLibPath(lib) {
    return path.join(LIB_PATH, lib);
}

export default defineConfig(async () => {
    await preCompileMagentoFiles(CURRENT_THEME);
    const themeConfig = themeResolver.getThemeConfig(CURRENT_THEME);
    const inputs = await moduleResolver.getAllJsVueFilesWithInheritanceCached(CURRENT_THEME);
    inputs[resolveLibPath('vue')] = `${PRECOMPILED_FOLDER}/${CURRENT_THEME}/precompiled.js`;

    if (themeConfig.exposeNpmPackages) {
        themeConfig.exposeNpmPackages.forEach((lib) => {
            inputs[resolveLibPath(lib.exposePath)] = lib.package;
        })
    }

    return {
        root: './',
        base: './',
        plugins: [
            inheritModuleResolver(),
            vue(),
            magentoHrmRewrite(),
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
                ...(inputs),
                vue: alisVueFileName,
                '#': path.resolve(__dirname, 'node_modules'),
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
                path: process.env.VITE_HMR_PATH ,
            }
        },
        appType: 'mpa'
    }
});
