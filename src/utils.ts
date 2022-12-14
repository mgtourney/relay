import { createLogger, format, Logger, transports } from 'winston';
import { logger } from './main.js';

const ENV_VARS = [
    "TA_URI",
    "HOST",
    "PORT",
    // "DOCKER", set by DockerFile if present
];

export function validateConfig() {
    for (const envVar of ENV_VARS) {
        if (!process.env[envVar]) {
            console.error(`Missing required environment variable ${envVar}`);
            process.exit(1);
        }
    }
}

export function setupLogger(): Logger {
    if (process.env.DOCKER) {
        return createLogger({
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
        return createLogger({
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
}
