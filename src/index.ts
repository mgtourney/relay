import { createLogger, format, Logger, transports } from "winston";
import RelayManager from "./RelayManager";
import dotenv from "dotenv"

dotenv.config();

if (!process.env.TA_URL) {
    throw new Error("TA_URL not set");
}

if (!process.env.RELAY_HOST) {
    throw new Error("RELAY_HOST not set");
}

if (!process.env.RELAY_PORT) {
    throw new Error("RELAY_PORT not set");
}

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

logger.info(`Starting relay server on ws://${process.env.RELAY_HOST}:${process.env.RELAY_PORT}`);

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
