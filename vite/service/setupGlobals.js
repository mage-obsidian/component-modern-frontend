import path from 'path';
global.appRoot = path.resolve(path.resolve(), 'node_modules');
global.importFromNode = async (moduleName) => {
    const suffixTries = [
        '.js',
        '/index.js',
        '/src/index.js',
    ];
    for (const suffix of suffixTries) {
        try {
            return await import(`${moduleName}${suffix}`);
        } catch (error) {
        }
    }
    throw new Error(`Module ${moduleName} not found`);
}
global.getPathFromNodeModules = (moduleName) => {
    return path.resolve(global.appRoot, moduleName);
}
