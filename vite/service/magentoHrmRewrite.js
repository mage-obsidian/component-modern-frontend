import moduleResolver from "#service/moduleResolver.js";

export default () => {
    const components = moduleResolver.getAllJsVueFilesWithInheritanceCached();
    return {
        name: 'handle-magento-routes-middleware',
            configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url;

                const matchedKey = Object.keys(components).find((key) => url.includes(key));

                if (matchedKey) {
                    const filePath = components[matchedKey];
                    const suffix = matchedKey === 'lib/vue' ? '/' : '/@fs';
                    req.url = `${suffix}${filePath}`;
                    next();
                } else {
                    next();
                }
            });
        },
    }
}
