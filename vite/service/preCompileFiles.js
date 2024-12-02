import path from "path";
import fs from "fs/promises";
import configResolver from "#service/configResolver.cjs";
import getThemeConfig from "#service/themeResolver.js";
import moduleResolver from "#service/moduleResolver.js";
import {
    MODULE_WEB_PATH,
    PRECOMPILED_FOLDER,
    ALL_JS_VUE_FILES_WITH_INHERITANCE_FILE_NAME,
    THEME_MODULE_WEB_PATH,
    THEME_CSS_FOLDER
} from "#config/default.cjs";
import {resolveFileByTheme} from "#service/moduleResolverSync.cjs";
const MODULE_CSS_EXTEND_FILE = configResolver.getMagentoConfig().MODULE_CSS_EXTEND_FILE;
async function getThemeImports(themeName) {
    const themeConfig = await getThemeConfig.getCssThemeConfig(themeName);
    const themePath = configResolver.getMagentoConfig().themes[themeName].src;

    let imports = '';
    if (themeConfig.includeParentThemes && themeConfig.parent) {
        imports += await getThemeImports(themeConfig.parent);
    }
    imports += `@import "${path.join(themePath, THEME_MODULE_WEB_PATH, THEME_CSS_FOLDER, configResolver.getMagentoConfig().THEME_TAILWIND_SOURCE_FILE)}";\n`;
    return imports;
}

function resolveModuleCssSourcePath(moduleName, themeName) {
    let moduleConfigSourcePath = resolveFileByTheme(themeName, moduleName, 'css', MODULE_CSS_EXTEND_FILE);
    if (!moduleConfigSourcePath) {
        const module = configResolver.getMagentoConfig().modules[moduleName];
        moduleConfigSourcePath = path.join(module.src, MODULE_WEB_PATH, 'css', MODULE_CSS_EXTEND_FILE);
    }
    return moduleConfigSourcePath;
}
async function generateCssImports(themeName) {
    const themeConfig = await getThemeConfig.getCssThemeConfig(themeName);
    const excludedModules = new Set(themeConfig.ignoredCssFromModules || []);
    const modulesConfig = configResolver.getModulesConfigArray();
    let cssImports = '';
    if (themeConfig.ignoredCssFromModules !== 'all') {
        for (const [moduleName, moduleConfig] of modulesConfig) {
            if (excludedModules.has(moduleName)) continue;

            const filePath = resolveModuleCssSourcePath(moduleName, themeName);
            try {
                await fs.access(filePath);
                cssImports += `@import "${filePath}";\n`;
            } catch {
            }
        }
    }
    cssImports += await getThemeImports(themeName);
    return cssImports;
}

async function writeToFile(outputPath, content) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content, 'utf-8');
}

async function precompileCss(themeName) {
    const cssContent = await generateCssImports(themeName);
    const outputPath = path.join(PRECOMPILED_FOLDER, themeName, 'precompiled.css');
    await writeToFile(outputPath, cssContent);
}

async function precompileJs(themeName) {
    const baseJsPath = './templates/base_main_js_file.js';
    const jsOutputPath = path.join(PRECOMPILED_FOLDER, themeName, 'precompiled.js');
    await fs.copyFile(baseJsPath, jsOutputPath);

    const vueFilesOutputPath = path.join(PRECOMPILED_FOLDER, themeName, ALL_JS_VUE_FILES_WITH_INHERITANCE_FILE_NAME);
    const vueFiles = await moduleResolver.getAllJsVueFilesWithInheritance();
    await writeToFile(vueFilesOutputPath, JSON.stringify(vueFiles));
}

export {
    precompileCss,
    precompileJs
};
