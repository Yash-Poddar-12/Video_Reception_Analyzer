// ==============================================================================
// config/index.js - Application Configuration
// ==============================================================================

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
    // Server configuration
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',

    // R configuration
    rExecutable: process.env.R_EXECUTABLE || 'Rscript.exe',
    rScriptsPath: process.env.R_SCRIPTS_PATH
        ? path.resolve(__dirname, '../../', process.env.R_SCRIPTS_PATH)
        : path.resolve(__dirname, '../../r'),
    modelsPath: process.env.MODELS_PATH
        ? path.resolve(__dirname, '../../', process.env.MODELS_PATH)
        : path.resolve(__dirname, '../../models'),
    tmpPath: process.env.TMP_DIR
        ? path.resolve(__dirname, '../../', process.env.TMP_DIR)
        : path.resolve(__dirname, '../../tmp'),

    // YouTube API
    youtubeApiKey: process.env.YOUTUBE_API_KEY,

    // Python MSSF Service
    pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
    pythonServiceTimeout: parseInt(process.env.PYTHON_SERVICE_TIMEOUT) || 120000,

    // Timeouts (in milliseconds)
    apiTimeout: parseInt(process.env.API_TIMEOUT) || 30000,
    rScriptTimeout: parseInt(process.env.R_SCRIPT_TIMEOUT) || 60000,

    // Limits
    maxComments: parseInt(process.env.MAX_COMMENTS) || 100,

    // CORS
    corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:3000'],
};
