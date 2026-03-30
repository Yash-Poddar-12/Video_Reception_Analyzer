// ==============================================================================
// routes/predict.js - Prediction Endpoint
// ==============================================================================

const express = require('express');
const router = express.Router();
const { runRScript } = require('../utils/rRunner');
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
 *   "interpretation": { ... },
 *   "statistics": { ... },
 *   "predictions": [ ... ]
 * }
 */
router.post('/', async (req, res, next) => {
    const startTime = Date.now();
    
    try {
        // Extract video identifier from request
        const { videoUrl, videoId } = req.body;
        
        if (!videoUrl && !videoId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: videoUrl or videoId',
            });
        }
        
        const videoIdentifier = videoId || videoUrl;
        logger.info('Prediction request received', { videoIdentifier });
        
        // Check for API key
        if (!config.youtubeApiKey) {
            return res.status(500).json({
                success: false,
                error: 'YouTube API key not configured',
            });
        }
        
        // Step 1: Fetch comments via api_fetch.R
        logger.info('Step 1: Fetching comments...', { videoIdentifier });
        
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
        
        logger.info('Comments fetched', { 
            count: fetchResult.comments_fetched,
            videoId: fetchResult.video_id,
        });
        
        // Step 2: Predict sentiment via predict.R
        logger.info('Step 2: Predicting sentiment...');
        
        // Provide accurate path format for predict.R relative to project root.
        // runRScript spawns process from root, so tmp is relative to root.
        const outputFilePath = fetchResult.output_file || 'tmp/comments.csv';
        const predictResult = await runRScript('predict.R', [outputFilePath]);
        
        if (!predictResult.success) {
            return res.status(500).json({
                success: false,
                error: predictResult.error || 'Failed to predict sentiment',
                step: 'predict',
            });
        }
        
        // Calculate response time
        const duration = Date.now() - startTime;
        
        logger.info('Prediction complete', {
            videoId: fetchResult.video_id,
            sentimentScore: predictResult.sentiment_score,
            commentsAnalyzed: fetchResult.comments_fetched,
            duration: `${duration}ms`,
        });
        
        // Return combined result
        res.json({
            success: true,
            videoId: fetchResult.video_id,
            commentsAnalyzed: fetchResult.comments_fetched,
            sentimentScore: predictResult.sentiment_score,
            interpretation: predictResult.interpretation,
            statistics: {
                positive: predictResult.statistics.positive_count || 0,
                negative: predictResult.statistics.negative_count || 0,
                neutral: 0, // Binary model doesn't have neutral
                positivePercent: predictResult.statistics.positive_percentage || 0,
                negativePercent: predictResult.statistics.negative_percentage || 0,
                neutralPercent: 0, // Binary model doesn't have neutral
            },
            samplePositive: predictResult.sample_positive || [],
            sampleNegative: predictResult.sample_negative || [],
            predictions: predictResult.predictions || [],
            processingTime: duration,
        });
        
        // Cleanup tmp CSV to not pollute disk space? Optional.
        
    } catch (error) {
        logger.error('Prediction failed', { error: error.message });
        next(error);
    }
});

module.exports = router;
