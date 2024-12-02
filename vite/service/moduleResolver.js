import path from "path";
import configResolver from "#service/configResolver.cjs";
import {
    ALL_JS_VUE_FILES_WITH_INHERITANCE_FILE_NAME,
    MODULE_WEB_PATH,
    PRECOMPILED_FOLDER,
    THEME_MODULE_WEB_PATH
} from "#config/default.cjs";
import getFilesFromFolders from '#utils/findComponents.js'
import fs from "fs";

const defaultFoldersToMap = [
    {
        src: configResolver.getMagentoConfig().VUE_COMPONENTS_PATH,
        ext: [
            'vue',
            'js'
        ]
    },
    {
        src: configResolver.getMagentoConfig().JS_PATH,
        ext: [
            'js'
        ]
    }
];

const cachedModulesByTheme = {};

async function getAllJsVueFilesFromActiveModules() {
    let result = {};
    for (const entry of configResolver.getModulesConfigArray()) {
        const [moduleName, moduleConfig] = entry;
        const moduleResult = await getFilesFromFolders(
            moduleName,
            path.resolve(moduleConfig.src, MODULE_WEB_PATH),
            defaultFoldersToMap
        );
        Object.assign(result, moduleResult);
    }
    return result;
}

async function getAllJsVueFilesFromTheme(themeName) {
    let result = {};
    const theme = configResolver.getMagentoConfig().themes[themeName];
    if (!theme) {
        return {}
    }
    if (theme.parent) {
        result = Object.assign(result, getAllJsVueFilesFromTheme(theme.parent));
    }

    for (const moduleName of configResolver.getAllMagentoModulesEnabled()) {
        const moduleResult = await getFilesFromFolders(
            moduleName,
            path.resolve(theme.src, moduleName, THEME_MODULE_WEB_PATH),
            defaultFoldersToMap
        );
        if (moduleResult) {
            Object.assign(result, moduleResult);
        }
    }
    const moduleResult = await getFilesFromFolders(
        'Theme',
        path.resolve(theme.src, THEME_MODULE_WEB_PATH),
        defaultFoldersToMap
    );
    Object.assign(result, moduleResult);
    return result;
}


function getAllJsVueFilesWithInheritanceCached(themeName) {
    themeName = themeName ?? process.env.ACTIVE_THEME;
    if (cachedModulesByTheme[themeName]) {
        return cachedModulesByTheme[themeName];
    }
    const filePath = path.join(PRECOMPILED_FOLDER, themeName, ALL_JS_VUE_FILES_WITH_INHERITANCE_FILE_NAME);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    cachedModulesByTheme[themeName] = data;
    return data;
}

async function getAllJsVueFilesWithInheritance() {
    const activeTheme = process.env.ACTIVE_THEME;
    if (cachedModulesByTheme[activeTheme]) {
        return cachedModulesByTheme[activeTheme];
    }
    const allJsVueFilesFromModules = await getAllJsVueFilesFromActiveModules();
    const allJsVueFilesFromThemes = await getAllJsVueFilesFromTheme(activeTheme);
    cachedModulesByTheme[activeTheme] = Object.assign(allJsVueFilesFromModules, allJsVueFilesFromThemes);
    return cachedModulesByTheme[activeTheme];
}

export default {
    getAllJsVueFilesWithInheritance,
    getAllJsVueFilesWithInheritanceCached
};
