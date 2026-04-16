// ==============================================================================
// server.js - Tube-Senti Backend Server
// ==============================================================================
// Purpose: Express REST API server that orchestrates R scripts for sentiment
//          prediction of YouTube video comments.
//
// Endpoints:
//   POST /api/predict  - Full prediction pipeline (fetch + predict)
//   GET  /api/health   - Server health check
//
// Usage: npm start (production) or npm run dev (development)
// ==============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Load configuration
const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const predictRouter = require('./routes/predict');
const healthRouter = require('./routes/health');

// ==============================================================================
// Initialize Express App
// ==============================================================================
const app = express();

// ==============================================================================
// Middleware Stack
// ==============================================================================

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging - Ensure the logs dir exists first
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));  // Console logging in development

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==============================================================================
// Routes
// ==============================================================================

// API routes
app.use('/api/predict', predictRouter);
app.use('/api/health', healthRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Tube-Senti Backend API',
        version: '1.0.0',
        endpoints: {
            predict: 'POST /api/predict',
            health: 'GET /api/health',
        },
    });
});

// ==============================================================================
// Error Handling
// ==============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==============================================================================
// Start Server
// ==============================================================================
const server = app.listen(config.port, () => {
    logger.info(`Tube-Senti backend started`, {
        port: config.port,
        environment: config.nodeEnv,
        cors: config.corsOrigins,
    });
    
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                   TUBE-SENTI BACKEND SERVER                       ║
╠════════════════════════════════════════════════════════════════════╣
║  Status:      Running                                              ║
║  Port:        ${config.port}                                              ║
║  Environment: ${config.nodeEnv.padEnd(52)}║
╠════════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                        ║
║    POST /api/predict  - Analyze video sentiment                    ║
║    GET  /api/health   - Health check                               ║
╚════════════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

module.exports = app;
