import app from './app.js';
import config from './config/index.js';
import logger from './config/logger.js';
config
    .init()
    .then(() => {
    app.listen(config.PORT, () => logger.info(`⚡ Server running on port ${config.PORT} ⚡`));
})
    .catch((err) => {
    if (err instanceof Error)
        logger.error(`Server failed to initialize ${err.message}`);
});
