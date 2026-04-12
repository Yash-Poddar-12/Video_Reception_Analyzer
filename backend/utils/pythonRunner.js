// ==============================================================================
// utils/pythonRunner.js - Python MSSF Service Client
// ==============================================================================
// Thin HTTP client that calls the Python FastAPI MSSF inference service.
// ==============================================================================

const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

/**
 * Call the Python MSSF service to predict sentiment for a batch of comments.
 *
 * @param {Array<{text: string, like_count: number, reply_count: number, comment_id?: string}>} comments
 * @param {number} totalComments - Total comments for engagement normalization
 * @returns {Promise<object>}  The full /predict response from the Python service
 */
async function callMSSFService(comments, totalComments = null) {
    const serviceUrl = config.pythonServiceUrl;
    const endpoint = `${serviceUrl}/predict`;

    logger.info('[Python] Calling MSSF service', {
        endpoint,
        commentCount: comments.length,
    });

    const payload = {
        comments,
        total_comments: totalComments || comments.length,
    };

    try {
        const response = await axios.post(endpoint, payload, {
            timeout: config.pythonServiceTimeout,
            headers: { 'Content-Type': 'application/json' },
        });
        logger.info('[Python] MSSF inference complete', {
            score: response.data.sentiment_score,
            mode: response.data.model_mode,
        });
        return response.data;
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            throw new Error(
                'Python MSSF service is not running. ' +
                'Start it with: uvicorn python.predict:app --port 8000'
            );
        }
        if (err.response) {
            throw new Error(
                `MSSF service error (${err.response.status}): ` +
                JSON.stringify(err.response.data)
            );
        }
        throw err;
    }
}

/**
 * Check if the Python MSSF service is healthy.
 * @returns {Promise<boolean>}
 */
async function checkMSSFHealth() {
    try {
        const serviceUrl = config.pythonServiceUrl;
        const resp = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
        return resp.data?.status === 'ok';
    } catch {
        return false;
    }
}

module.exports = { callMSSFService, checkMSSFHealth };
