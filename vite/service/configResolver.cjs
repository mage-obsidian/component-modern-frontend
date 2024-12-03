const { DEPENDENCY_CONFIG_FILE_PATH, OUTPUT_THEME_DIR } = require('#config/default.cjs');
const fs = require('fs');
const path = require('path');

let MAGENTO_CONFIG;

try {
    const magentoConfigJson = fs.readFileSync(DEPENDENCY_CONFIG_FILE_PATH, 'utf-8');
    MAGENTO_CONFIG = JSON.parse(magentoConfigJson);
} catch (error) {
    console.error(`Error reading or parsing configuration file at ${DEPENDENCY_CONFIG_FILE_PATH}:`, error.message);
    console.error('Try running `devcore:frontend:config --generate` to generate the configuration file.');
    process.exit(1); // Termina el proceso si no se puede leer el archivo de configuración
}

const getModulesConfigArray = () => Object.entries(MAGENTO_CONFIG.modules);
const getThemesConfigArray = () => Object.entries(MAGENTO_CONFIG.themes);
const getAllMagentoModulesEnabled = () => MAGENTO_CONFIG.allModules;
const isDev = () => MAGENTO_CONFIG.mode !== 'production';
const getOutputDirFromTheme = (themePath) => path.resolve(themePath, OUTPUT_THEME_DIR);

const getModuleDefinition = (moduleName) => {
    return MAGENTO_CONFIG.modules[moduleName];
}

const getThemeDefinition = (themeName) => {
    return MAGENTO_CONFIG.themes[themeName];
}

module.exports = {
    getMagentoConfig: () => MAGENTO_CONFIG,
    getModulesConfigArray,
    getThemesConfigArray,
    getAllMagentoModulesEnabled,
    isDev,
    getOutputDirFromTheme,
    getThemeDefinition,
    getModuleDefinition
};
