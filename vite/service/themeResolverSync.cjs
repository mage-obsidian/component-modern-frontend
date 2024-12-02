const path = require("path");
const fs = require("fs");
const deepmerge = require("deepmerge");
const { THEME_MODULE_WEB_PATH } = require("#config/default.cjs");
const configResolver = require("#service/configResolver.cjs");

const themeConfigCache = new Map();

function getThemeConfigPath(themeSrc) {
    return path.join(themeSrc, THEME_MODULE_WEB_PATH, configResolver.getMagentoConfig().THEME_CONFIG_FILE);
}

function loadThemeConfig(themeName) {
    const theme = configResolver.getMagentoConfig().themes[themeName];
    if (!theme) return null;

    try {
        const configPath = getThemeConfigPath(theme.src);
        fs.accessSync(configPath, fs.constants.F_OK);

        const themeConfig = require(configPath);
        return themeConfig.default ?? themeConfig;
    } catch {
        console.error(`Failed to load configuration for theme "${themeName}"`);
        return null;
    }
}

function getThemeConfig(themeName) {
    if (themeConfigCache.has(themeName)) return themeConfigCache.get(themeName);

    const theme = configResolver.getMagentoConfig().themes[themeName];
    if (!theme) return null;

    let themeConfig = loadThemeConfig(themeName);
    if (!themeConfig) return null;

    if (themeConfig.tailwind?.content) {
        themeConfig.tailwind.content = themeConfig.tailwind.content.map((content) =>
            path.join(theme.src, "web", content)
        );
    }

    if (themeConfig.includeParentThemes && theme.parent) {
        themeConfig = deepmerge(getThemeConfig(theme.parent) || {}, themeConfig);
    }

    themeConfigCache.set(themeName, themeConfig);
    return themeConfig;
}

function getTailwindThemeConfig(themeName) {
    return getThemeConfig(themeName)?.tailwind ?? {};
}

module.exports = {
    getThemeConfig
};
