// ==============================================================================
// routes/health.js - Health Check Endpoint (MSSF Pipeline)
// ==============================================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { checkMSSFHealth } = require('../utils/pythonRunner');

/**
 * GET /api/health
 *
 * Checks:
 *   server     - Express is running
 *   rscript    - Rscript is on PATH
 *   mssfModel  - Python MSSF service is alive and model is loaded
 *   youtubeApi - YouTube API key is configured
 */
router.get('/', async (req, res) => {
    const checks = {
        server:    true,
        rscript:   false,
        mssfModel: false,
        youtubeApi: false,
    };

    // ── Check R installation ─────────────────────────────────────────────────
    try {
        await new Promise((resolve, reject) => {
            const child = spawn(config.rExecutable, ['--version']);
            child.on('close', (code) => { if (code === 0) resolve(); else reject(); });
            child.on('error', reject);
        });
        checks.rscript = true;
    } catch {
        checks.rscript = false;
    }

    // ── Check Python MSSF service ────────────────────────────────────────────
    checks.mssfModel = await checkMSSFHealth();

    // ── Check YouTube API key ────────────────────────────────────────────────
    checks.youtubeApi = !!config.youtubeApiKey;

    // ── Overall status ───────────────────────────────────────────────────────
    const criticalChecks = [checks.server, checks.mssfModel, checks.youtubeApi];
    const allPassing = criticalChecks.every(v => v);
    const status = allPassing ? 'healthy' : 'degraded';

    res.status(allPassing ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        checks,
        services: {
            node: `localhost:${config.port}`,
            python: config.pythonServiceUrl,
        },
        version: process.env.npm_package_version || '2.0.0',
        environment: config.nodeEnv,
        architecture: 'MSSF (Twitter-RoBERTa + Emoji + Engagement)',
    });
});

module.exports = router;
