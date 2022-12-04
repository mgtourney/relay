import { logger } from './index.js';

const ENV_VARS = [
    "TA_URI",
    "HOST",
    "PORT",
    // "DOCKER", set by DockerFile if present
];

export function validateConfig() {
    for (const envVar of ENV_VARS) {
        if (!process.env[envVar]) {
            logger.error(`Missing required environment variable ${envVar}`);
            process.exit(1);
        }
    }
}
