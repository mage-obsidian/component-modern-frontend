const path = require('path');
const { fileURLToPath } = require('url');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const BASE_PATH = path.resolve(__dirname, '../..');

const DEPENDENCY_CONFIG_FILENAME = 'mage_obsidian_frontend_modules.json';
const MAGENTO_CONFIG_RELATIVE_PATH = 'app/etc/';
const DEPENDENCY_CONFIG_FILE_PATH = path.resolve(
    BASE_PATH,
    MAGENTO_CONFIG_RELATIVE_PATH,
    DEPENDENCY_CONFIG_FILENAME
);

const MODULE_WEB_PATH = 'view/frontend/web/';
const THEME_MODULE_WEB_PATH = 'web/';
const MODULE_CSS_FOLDER = 'css';

const THEME_CSS_FOLDER = 'css';

const OUTPUT_THEME_DIR = 'web/generated';
const OUTPUT_JS_DIR = 'js/';
const OUTPUT_CSS_DIR = 'css/';
const PRECOMPILED_FOLDER = '.precompiled';

const ALL_JS_VUE_FILES_WITH_INHERITANCE_FILE_NAME = 'allJsVueFilesWithInheritance.json';

module.exports = {
    DEPENDENCY_CONFIG_FILENAME,
    MAGENTO_CONFIG_RELATIVE_PATH,
    DEPENDENCY_CONFIG_FILE_PATH,
    MODULE_WEB_PATH,
    THEME_MODULE_WEB_PATH,
    MODULE_CSS_FOLDER,
    THEME_CSS_FOLDER,
    OUTPUT_THEME_DIR,
    OUTPUT_JS_DIR,
    OUTPUT_CSS_DIR,
    PRECOMPILED_FOLDER,
    ALL_JS_VUE_FILES_WITH_INHERITANCE_FILE_NAME,
};
