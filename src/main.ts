import dotenv from 'dotenv';
import Relay from './controllers/Relay.js';
import { validateConfig, setupLogger } from './utils.js';

dotenv.config();

validateConfig();

const logger = setupLogger();

logger.info(`Starting relay server on ws://${process.env.HOST || "unknown"}:${process.env.PORT || "unknown"}`);

const relay = new Relay({
    taUrl: process.env.TA_URI as string,
    relayPort: process.env.PORT as unknown as number
});

process.on('SIGINT', function () {
    const success = relay.shutdown();

    if (success) {
        process.exit(0);
    } else {
        logger.error(`Failed to shutdown cleanly`);
        process.exit(1);
    }
});

export { logger };