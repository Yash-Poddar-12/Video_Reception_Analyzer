// ==============================================================================
// utils/logger.js - Logging Utility
// ==============================================================================

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log file streams
const accessLog = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
const errorLog = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });

/**
 * Log levels
 */
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
};

/**
 * Format log message
 */
function formatMessage(level, message, meta = {}) {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    });
}

/**
 * Logger object
 */
const logger = {
    info: (message, meta) => {
        const formatted = formatMessage(LOG_LEVELS.INFO, message, meta);
        console.log(formatted);
        accessLog.write(formatted + '\n');
    },
    
    error: (message, meta) => {
        const formatted = formatMessage(LOG_LEVELS.ERROR, message, meta);
        console.error(formatted);
        errorLog.write(formatted + '\n');
    },
    
    warn: (message, meta) => {
        const formatted = formatMessage(LOG_LEVELS.WARN, message, meta);
        console.warn(formatted);
        accessLog.write(formatted + '\n');
    },
    
    debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
            const formatted = formatMessage(LOG_LEVELS.DEBUG, message, meta);
            console.log(formatted);
        }
    },
};

module.exports = logger;
