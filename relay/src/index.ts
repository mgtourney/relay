import { createLogger, format, transports } from "winston";
import RelayManager from "./RelayManager";
import dotenv from "dotenv"

dotenv.config();

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.colorize(),
        format.simple()
    )
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        level: 'debug',
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

const relay = new RelayManager({
    taUrl: process.env.TA_URL,
    relayPort: process.env.RELAY_PORT,
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
