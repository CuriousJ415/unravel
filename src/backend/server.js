/**
 * UNRAVEL Server
 * Personal AI pattern processor inspired by Daniel Miessler's Fabric
 * Clean, focused implementation for web interface
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', require('./routes/api'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 UNRAVEL Server Started
───────────────────────────
🌐 URL: http://0.0.0.0:${PORT}
📁 Serving: ${path.join(__dirname, '../frontend')}
🤖 AI Providers: ${Object.keys(process.env).filter(k => k.endsWith('_API_KEY')).length} configured
⚡ Environment: ${process.env.NODE_ENV || 'development'}
📝 Patterns: Loading from patterns directory
───────────────────────────
Ready to unravel! 🧵✨
    `);
});

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});