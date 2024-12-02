import moduleResolver from "#service/moduleResolver.js";
import tailwindResolver from "#service/tailwindResolver.cjs";
import deepmerge from "deepmerge";

const activeTheme = process.env.ACTIVE_THEME;
const themeConfig = tailwindResolver.getTailwindConfigByTheme(activeTheme) ?? {};
const vueModules = moduleResolver.getAllJsVueFilesWithInheritanceCached(activeTheme);
const defaultConfig = {
    content: [
        ...Object.values(vueModules)
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
export default deepmerge(defaultConfig, themeConfig);
