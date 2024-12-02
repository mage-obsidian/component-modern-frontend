import {defineConfig} from 'vite';
import "#service/setupGlobals.js";
import vue from '@vitejs/plugin-vue';
import configResolver from "#service/configResolver.cjs";
import {OUTPUT_CSS_DIR, PRECOMPILED_FOLDER,} from '#config/default.cjs';
import moduleResolver from "#service/moduleResolver.js"
import inheritModuleResolver from '#service/inheritModuleResolver.js'
import preCompileMagentoFiles from '#service/preCompileMagentoFiles.js';
import magentoHrmRewrite from "#service/magentoHrmRewrite.js";
import path from "path";

const ACTIVE_THEME = process.env.ACTIVE_THEME;

let currentTheme = configResolver.getMagentoConfig().themes[ACTIVE_THEME];

let vueFileExt = (process.env.NODE_ENV !== 'production') ? '.js' : '.prod.js';
let vueFileName = 'vue.esm-browser' + vueFileExt;
let alisVueFileName = `vue/dist/${vueFileName}`

const outputDir = configResolver.getOutputDirFromTheme(currentTheme.src);

export default defineConfig(async () => {
    await preCompileMagentoFiles(ACTIVE_THEME);

    const inputs = await moduleResolver.getAllJsVueFilesWithInheritanceCached(ACTIVE_THEME);
    inputs['lib/vue'] = `${PRECOMPILED_FOLDER}/${process.env.ACTIVE_THEME}/precompiled.js`;
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
            host: 'phpfpm',
            fs: {
                allow: ['/var/www/html'],
            },
            hmr: {
                host: 'magento.test',
                protocol: 'wss',
                path: '/__vite_ping',
            }
        },
        appType: 'mpa'
    }
});
