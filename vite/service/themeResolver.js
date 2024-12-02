import path from "path";
import {
    THEME_MODULE_WEB_PATH
} from "#config/default.cjs";
import configResolver from "#service/configResolver.cjs";
import fs from "fs/promises";
import deepmerge from "deepmerge";

// Cache para optimizar las llamadas repetidas
const themeConfigCache = new Map();
const tailwindConfigCache = new Map();

/**
 * Obtiene la ruta de configuración del tema.
 * @param {string} themeSrc - Ruta base del tema.
 * @returns {string} Ruta completa del archivo de configuración.
 */
function getThemeConfigPath(themeSrc) {
    return path.join(themeSrc, THEME_MODULE_WEB_PATH, configResolver.getMagentoConfig().THEME_CONFIG_FILE);
}

/**
 * Carga y valida la configuración de un tema.
 * @param {string} themeName - Nombre del tema.
 * @returns {Promise<object|null>} Configuración del tema o null si no existe.
 */
async function loadThemeConfig(themeName) {
    const theme = configResolver.getMagentoConfig().themes[themeName];
    if (!theme) return null;

    const configPath = getThemeConfigPath(theme.src);
    await fs.access(configPath);
    const themeConfig = await import(configPath);
    return themeConfig.default ?? themeConfig;
}

async function getThemeConfigPathByThemeName(themeName) {
    const theme = configResolver.getMagentoConfig().themes[themeName];
    if (!theme) return null;

    return getThemeConfigPath(theme.src);
}

/**
 * Obtiene la configuración CSS de un tema.
 * Usa un sistema de caché para optimizar el rendimiento.
 * @param {string} themeName - Nombre del tema.
 * @returns {Promise<object|null>} Configuración CSS.
 */
async function getCssThemeConfig(themeName) {
    if (themeConfigCache.has(themeName)) {
        return themeConfigCache.get(themeName);
    }

    const theme = configResolver.getMagentoConfig().themes[themeName];
    if (!theme) return null;

    const themeConfig = await loadThemeConfig(themeName);
    if (!themeConfig) return null;

    let result = themeConfig;
    if (themeConfig.includeParentThemes && theme.parent) {
        const parentConfig = await getCssThemeConfig(theme.parent);
        result = deepmerge(parentConfig || {}, themeConfig);
    }

    themeConfigCache.set(themeName, result);
    return result;
}

function getTailwindThemeConfigCached(themeName) {
    if (tailwindConfigCache.has(themeName)) {
        return tailwindConfigCache.get(themeName);
    }
    throw new Error(`Tailwind config not found for theme: ${themeName}`);
}

/**
 * Obtiene la configuración de Tailwind de un tema.
 * Usa un sistema de caché para optimizar el rendimiento.
 * @param {string} themeName - Nombre del tema.
 * @returns {Promise<object|null>} Configuración de Tailwind.
 */
async function getTailwindThemeConfig(themeName) {

    if (tailwindConfigCache.has(themeName)) {
        return tailwindConfigCache.get(themeName);
    }

    const theme = configResolver.getMagentoConfig().themes[themeName];
    if (!theme) return null;

    const themeConfig = await loadThemeConfig(themeName);
    if (!themeConfig) return null;
    let tailwindConfig = themeConfig?.tailwind ?? {};
    if (tailwindConfig.content) {
        tailwindConfig = {
            ...tailwindConfig,
            content: tailwindConfig.content.map((content) =>
                path.join(theme.src, 'web', content)
            ),
        };
    }

    if (themeConfig.includeParentThemes && theme.parent) {
        const parentConfig = await getTailwindThemeConfig(theme.parent);
        tailwindConfig = deepmerge(parentConfig || {}, tailwindConfig);
    }

    tailwindConfigCache.set(themeName, tailwindConfig);
    return tailwindConfig;
}


export default {
    getCssThemeConfig,
    getTailwindThemeConfig,
    getTailwindThemeConfigCached,
    getThemeConfigPathByThemeName
};
