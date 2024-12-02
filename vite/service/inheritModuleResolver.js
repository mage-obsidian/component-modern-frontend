import moduleResolver from "#service/moduleResolver.js";
import path from "path";
import configResolver from "#service/configResolver.cjs";

export default function customResolverPlugin() {
    const allComponents = moduleResolver.getAllJsVueFilesWithInheritanceCached();
    const validComponentExtensions = configResolver.getMagentoConfig().ALLOWED_EXTENSIONS;
    const extensionsPattern = validComponentExtensions.map((ext) =>
        ext.replace('.', '')
    ).join("|");
    const dynamicRegex = new RegExp(
        `(["'])([\\w\\d]+::[\\w\\d/]+\\.(.${extensionsPattern}))\\1`,
        "g"
    );

    const hasValidExtension = (filePath) =>
        validComponentExtensions.some((ext) => filePath.endsWith(ext));

    const resolveComponentPath = (moduleName, filePath) => {
        if (!filePath.startsWith("components/") && !filePath.startsWith("js/")) {
            filePath = "components/" + filePath;
        }
        const fileName = path.join(
            path.dirname(filePath),
            path.parse(filePath).name
        );
        return allComponents[`${moduleName}/${fileName}`];
    };

    return {
        name: "inherit-resolver",
        transform(code, id) {
            if (!hasValidExtension(id)) return null;

            return code.replace(dynamicRegex, (match, quote, fullImport) => {
                const [moduleName, filePath] = fullImport.split("::");

                if (!hasValidExtension(filePath)) {
                    return match;
                }

                const componentSrc = resolveComponentPath(moduleName, filePath);
                if (!componentSrc) {
                    console.warn(
                        `Warning: Component "${moduleName}/${filePath}" not found.`
                    );
                    return match;
                }

                return `${quote}${componentSrc}${quote}`;
            });
        },
    };
}
