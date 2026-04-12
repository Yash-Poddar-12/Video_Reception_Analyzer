// ==============================================================================
// routes/predict.js - Prediction Endpoint (MSSF Pipeline)
// ==============================================================================
//
// 3-step pipeline:
//   Step 1: api_fetch.R     → Fetch YouTube comments (R)
//   Step 2: preprocess.R    → Clean & normalize comments (R)
//   Step 3: Python FastAPI  → MSSF inference (Python/PyTorch)
//
// ==============================================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { runRScript } = require('../utils/rRunner');
const { callMSSFService } = require('../utils/pythonRunner');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * POST /api/predict
 *
 * Request body:
 * {
 *   "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
 *   // OR
 *   "videoId": "VIDEO_ID"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "sentimentScore": 72.5,
 *   "interpretation": { label, description, emoji },
 *   "statistics": { positive, neutral, negative, positivePercent, ... },
 *   "samplePositive": [...],
 *   "sampleNegative": [...],
 *   "predictions": [...],
 *   "processingTime": 4200,
 *   "modelInfo": { ... }
 * }
 */
router.post('/', async (req, res, next) => {
    const startTime = Date.now();

    try {
        // ── Validate request ─────────────────────────────────────────────────
        const { videoUrl, videoId } = req.body;

        if (!videoUrl && !videoId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: videoUrl or videoId',
            });
        }

        const videoIdentifier = videoId || videoUrl;
        logger.info('Prediction request received', { videoIdentifier });

        if (!config.youtubeApiKey) {
            return res.status(500).json({
                success: false,
                error: 'YouTube API key not configured',
            });
        }

        // ── Step 1: Fetch comments via R → api_fetch.R ───────────────────────
        logger.info('Step 1: Fetching comments from YouTube...', { videoIdentifier });

        const fetchResult = await runRScript('api_fetch.R', [
            videoIdentifier,
            config.youtubeApiKey,
            config.maxComments.toString(),
        ]);

        if (!fetchResult.success) {
            return res.status(400).json({
                success: false,
                error: fetchResult.error || 'Failed to fetch comments',
                step: 'fetch',
            });
        }

        logger.info('Step 1 complete: Comments fetched', {
            count: fetchResult.comments_fetched,
            videoId: fetchResult.video_id,
        });

        // ── Step 2: Preprocess via R → preprocess.R ──────────────────────────
        logger.info('Step 2: Preprocessing comments (R layer)...');

        const rawCommentsCsv = fetchResult.output_file || 'tmp/comments.csv';
        const preprocessResult = await runRScript('preprocess.R', [rawCommentsCsv]);

        if (!preprocessResult.success) {
            return res.status(500).json({
                success: false,
                error: preprocessResult.error || 'Failed to preprocess comments',
                step: 'preprocess',
            });
        }

        logger.info('Step 2 complete: Preprocessing done', {
            count: preprocessResult.comments_count,
        });

        // ── Step 3: MSSF Inference via Python FastAPI ─────────────────────────
        logger.info('Step 3: Running MSSF inference (Python)...');

        // Read the preprocessed CSV and pass comments to Python service
        const processedCsvPath = path.resolve(
            __dirname, '../..', preprocessResult.output_file
        );
        const comments = parseCommentsCsv(processedCsvPath);

        if (!comments || comments.length === 0) {
            return res.status(500).json({
                success: false,
                error: 'No comments available after preprocessing',
                step: 'preprocess',
            });
        }

        const mssfResult = await callMSSFService(comments, preprocessResult.total_comments);

        if (!mssfResult.success) {
            return res.status(500).json({
                success: false,
                error: 'MSSF inference failed',
                step: 'inference',
            });
        }

        // ── Save predictions CSV for R evaluation layer ───────────────────────
        savePredictionsCsv(mssfResult.predictions, comments);

        const duration = Date.now() - startTime;
        logger.info('Prediction complete', {
            videoId: fetchResult.video_id,
            sentimentScore: mssfResult.sentiment_score,
            commentsAnalyzed: comments.length,
            duration: `${duration}ms`,
        });

        // ── Return unified response ───────────────────────────────────────────
        return res.json({
            success: true,
            videoId: fetchResult.video_id,
            commentsAnalyzed: comments.length,
            sentimentScore: mssfResult.sentiment_score,
            interpretation: mssfResult.interpretation,
            statistics: {
                positive: mssfResult.statistics.positive_count || 0,
                negative: mssfResult.statistics.negative_count || 0,
                neutral: mssfResult.statistics.neutral_count || 0,
                positivePercent: mssfResult.statistics.positive_percentage || 0,
                negativePercent: mssfResult.statistics.negative_percentage || 0,
                neutralPercent: mssfResult.statistics.neutral_percentage || 0,
            },
            samplePositive: mssfResult.sample_positive || [],
            sampleNegative: mssfResult.sample_negative || [],
            predictions: (mssfResult.predictions || []).slice(0, 50), // cap for response size
            processingTime: duration,
            modelInfo: {
                name: 'MSSF (Multi-Signal Sentiment Fusion)',
                backbone: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
                branches: ['Twitter-RoBERTa (768d)', 'Emoji Lexicon (3d)', 'Engagement (2d)'],
                mode: mssfResult.model_mode,
                inferenceMs: mssfResult.processing_time_ms,
            },
        });

    } catch (error) {
        logger.error('Prediction pipeline failed', { error: error.message });
        next(error);
    }
});

// ==============================================================================
// Helpers
// ==============================================================================

/**
 * Parse preprocessed CSV into comment objects for the Python service.
 * @param {string} csvPath
 * @returns {Array<{text, like_count, reply_count, comment_id}>}
 */
function parseCommentsCsv(csvPath) {
    if (!fs.existsSync(csvPath)) return [];

    const raw = fs.readFileSync(csvPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const textIdx    = headers.findIndex(h => h.toLowerCase() === 'text');
    const likeIdx    = headers.findIndex(h => h.toLowerCase() === 'like_count');
    const replyIdx   = headers.findIndex(h => h.toLowerCase() === 'reply_count');
    const idIdx      = headers.findIndex(h => h.toLowerCase() === 'comment_id');
    const authorIdx  = headers.findIndex(h => h.toLowerCase() === 'author');

    if (textIdx === -1) return [];

    const comments = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (!cols[textIdx]) continue;
        comments.push({
            text:        cols[textIdx] || '',
            like_count:  parseInt(cols[likeIdx]) || 0,
            reply_count: parseInt(cols[replyIdx]) || 0,
            comment_id:  cols[idIdx] || `c${i}`,
            author:      cols[authorIdx] || 'unknown',
        });
    }
    return comments;
}

/**
 * Parse a single CSV line respecting quoted fields.
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Save predictions CSV for R evaluation layer.
 */
function savePredictionsCsv(predictions, comments) {
    try {
        if (!predictions || predictions.length === 0) return;

        const commentMap = {};
        if (comments) {
            for (const c of comments) {
                commentMap[c.comment_id] = c;
            }
        }

        const rows = [
            'comment_id,text,sentiment,confidence,prob_positive,prob_neutral,prob_negative,like_count,reply_count'
        ];
        for (const pred of predictions) {
            const orig = commentMap[pred.comment_id] || {};
            const text = (pred.text || '').replace(/"/g, '""');
            rows.push([
                pred.comment_id || '',
                `"${text}"`,
                pred.sentiment || '',
                (pred.confidence || 0).toFixed(4),
                (pred.prob_positive || 0).toFixed(4),
                (pred.prob_neutral || 0).toFixed(4),
                (pred.prob_negative || 0).toFixed(4),
                orig.like_count || 0,
                orig.reply_count || 0,
            ].join(','));
        }

        const outputPath = path.resolve(__dirname, '../../tmp/predictions.csv');
        fs.writeFileSync(outputPath, rows.join('\n'), 'utf-8');
        logger.info('Predictions CSV saved for R evaluation', { path: outputPath });
    } catch (err) {
        logger.warn('Failed to save predictions CSV', { error: err.message });
    }
}

module.exports = router;
