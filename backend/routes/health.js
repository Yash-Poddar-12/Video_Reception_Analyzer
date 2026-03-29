// ==============================================================================
// routes/health.js - Health Check Endpoint
// ==============================================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * GET /api/health
 * 
 * Response:
 * {
 *   "status": "healthy",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "checks": {
 *     "server": true,
 *     "rscript": true,
 *     "model": true,
 *     "youtubeApi": true
 *   }
 * }
 */
router.get('/', async (req, res) => {
    const checks = {
        server: true,
        rscript: false,
        model: false,
        youtubeApi: false,
    };

    // Check R installation
    try {
        await new Promise((resolve, reject) => {
            const child = spawn(config.rExecutable, ['--version']);

            child.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error('R not found'));
            });

            child.on('error', reject);
        });
        checks.rscript = true;
    } catch (e) {
        checks.rscript = false;
    }

    // Check model file
    const modelPath = path.join(config.modelsPath, 'nb_model.rds');
    checks.model = fs.existsSync(modelPath);

    // Check YouTube API key configured
    checks.youtubeApi = !!config.youtubeApiKey;

    // Determine overall status
    const allPassing = Object.values(checks).every(v => v);
    const status = allPassing ? 'healthy' : 'degraded';

    res.status(allPassing ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        checks,
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
    });
});

module.exports = router;
