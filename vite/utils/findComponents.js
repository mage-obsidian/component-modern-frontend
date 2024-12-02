import fs from "fs";
import path from "path";

/**
 * Recursively searches for `.vue` and `.js` files in the `components` directory
 * of a given module and organizes them into an object.
 *
 * @param {string} moduleName - The name of the module to associate the files with.
 * @param moduleDir
 * @param directories
 * @returns {Promise<Object>} - A promise that resolves to an object where:
 *   - The keys are unique identifiers for the files, formed by combining
 *     subdirectories and file names (e.g., `Vendor_ModuleName/FilePath`).
 *   - The values are the full relative paths to the files within the `components` folder.
 * @throws {Error} - Throws an error if duplicate file names (with different extensions) are found.
 */
async function getFilesFromFolders(
    moduleName,
    moduleDir,
    directories
) {
    const componentsDir = path.resolve(moduleDir);
    const getFilesFromFolderWithExt = async (dir, folderToSearch, extArr, baseDir = "") => {
        if (!fs.existsSync(dir)) return [];
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const keyRegistred = [];
        const files = await Promise.all(
            entries.map(async (entry) => {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.join(baseDir, entry.name);
                if (entry.isDirectory()) {
                    return await getFilesFromFolderWithExt(fullPath, folderToSearch, extArr, relativePath);
                } else if (entry.isFile() && (entry.name.endsWith(".vue") || entry.name.endsWith(".js"))) {
                    const fileName = path.parse(entry.name).name;
                    let key =
                        baseDir === ""
                            ? fileName
                            : `${baseDir}/${fileName}`;
                    key = `${moduleName}/${folderToSearch}/${key}`;
                    const filePath = path.join(dir, entry.name);
                    if (keyRegistred.includes(key)) {
                        throw new Error(`Duplicate file names detected: The file "${filePath}".`);
                    }
                    keyRegistred.push(key);
                    return { [key]: filePath };
                }
                return null;
            })
        );
        return files.filter(Boolean).flat();
    };

    try {
        let result = [];
        for (const directory of directories) {
            const folderPath = path.resolve(componentsDir, directory.src);
            const filesArray = await getFilesFromFolderWithExt(folderPath, directory.src, directory.ext);
            result.push(...filesArray);
        }
        result = result.reduce((acc, item) => Object.assign(acc, item), {});
        return result;
    } catch (err) {
        throw new Error(`Error while processing JavaScript or Vue files in the components folder of module "${moduleName}": ${err.message}`);
    }
}

export default getFilesFromFolders;
