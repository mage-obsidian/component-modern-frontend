const themeResolver = require('#service/themeResolverSync.cjs');
const moduleResolver = require('#service/moduleResolverSync.cjs');
const deepmerge = require('deepmerge');

function getTailwindConfigByTheme(themeName) {
    const themeConfig = themeResolver.getThemeConfig(themeName);
    return deepmerge(
        moduleResolver.getModuleConfigByThemeConfig(themeName, themeConfig)?.tailwind ?? {},
        themeConfig?.tailwind ?? {}
    );
}

module.exports = {
    getTailwindConfigByTheme
};
