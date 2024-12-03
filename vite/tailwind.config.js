import moduleResolver from "#service/moduleResolver.js";
import tailwindResolver from "#service/tailwindResolver.cjs";
import deepmerge from "deepmerge";

const CURRENT_THEME = process.env.CURRENT_THEME;
const themeConfig = tailwindResolver.getTailwindConfigByTheme(CURRENT_THEME) ?? {};
const vueModules = moduleResolver.getAllJsVueFilesWithInheritanceCached(CURRENT_THEME);
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
