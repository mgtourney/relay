import dotenv from 'dotenv';
import RelayManager from './controllers/Relay.js';
import {
    createLogger,
    format,
    Logger,
    transports
} from 'winston';
import { validateConfig } from './utils.js';

dotenv.config();

validateConfig();

let logger: Logger;

if (process.env.DOCKER) {
    logger = createLogger({
        level: "info",
        format: format.combine(
            format.timestamp(),
            format.json()
        ),
        transports: [
            new transports.Console()
        ]
    });
} else {
    logger = createLogger({
        level: "info",
        format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
        transports: [
            new transports.Console()
        ]
    });
}

logger.info(`Starting relay server on ws://${process.env.HOST}:${process.env.PORT}`);

const relay = new RelayManager({
    taUrl: process.env.TA_URI,
    relayPort: process.env.PORT,
});

process.on('SIGINT', function () {
    relay.shutdown().then((success) => {
        if (success) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
});

export { logger };