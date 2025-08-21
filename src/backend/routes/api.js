/**
 * UNRAVEL API Routes
 * Clean, focused REST API for personal AI processing
 */

const express = require('express');
const router = express.Router();
const unravelService = require('../services/unravelService');
const multer = require('multer');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (error) {
            console.warn('Upload directory creation warning:', error.message);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = file.originalname.split('.').pop();
        cb(null, `${timestamp}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        // Allow text files, PDFs, and common document formats
        const allowedTypes = [
            'text/plain', 'text/markdown', 'text/csv',
            'application/pdf', 
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/json'
        ];
        
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});

/**
 * GET /api/status
 * Health check and system status
 */
router.get('/status', async (req, res) => {
    try {
        const status = await unravelService.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * GET /api/patterns
 * Get available patterns organized by category
 */
router.get('/patterns', (req, res) => {
    try {
        const patterns = unravelService.getPatterns();
        res.json({ patterns });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get patterns',
            message: error.message
        });
    }
});

/**
 * GET /api/patterns/:name
 * Get specific pattern details
 */
router.get('/patterns/:name', (req, res) => {
    try {
        const pattern = unravelService.getPattern(req.params.name);
        res.json(pattern);
    } catch (error) {
        res.status(404).json({
            error: 'Pattern not found',
            message: error.message
        });
    }
});

/**
 * GET /api/providers
 * Get available AI providers and their models
 */
router.get('/providers', async (req, res) => {
    try {
        const providers = await unravelService.getProviders();
        res.json({ providers });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get providers',
            message: error.message
        });
    }
});

/**
 * POST /api/providers/configure
 * Configure providers with API keys and get updated availability
 */
router.post('/providers/configure', async (req, res) => {
    try {
        const { apiKeys = {} } = req.body;
        
        // Configure providers with API keys
        const providers = await unravelService.configureProviders(apiKeys);
        res.json({ providers });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to configure providers',
            message: error.message
        });
    }
});

/**
 * POST /api/process
 * Process text input with selected pattern and AI model
 */
router.post('/process', async (req, res) => {
    try {
        const { pattern, input, provider, model, options = {} } = req.body;
        
        if (!pattern || !input || !provider || !model) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['pattern', 'input', 'provider', 'model']
            });
        }
        
        const result = await unravelService.process({
            pattern,
            input,
            provider,
            model,
            options
        });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Processing failed',
            message: error.message
        });
    }
});

/**
 * POST /api/process-file
 * Process uploaded file with selected pattern
 */
router.post('/process-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }
        
        const { pattern, provider, model, options = {} } = req.body;
        
        if (!pattern || !provider || !model) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['pattern', 'provider', 'model']
            });
        }
        
        // Read file content
        const fileContent = await fs.readFile(req.file.path, 'utf8');
        
        const result = await unravelService.process({
            pattern,
            input: fileContent,
            provider,
            model,
            options
        });
        
        // Clean up uploaded file
        try {
            await fs.unlink(req.file.path);
        } catch (cleanupError) {
            console.warn('File cleanup warning:', cleanupError.message);
        }
        
        if (result.success) {
            res.json({
                ...result,
                fileInfo: {
                    originalName: req.file.originalname,
                    size: req.file.size,
                    type: req.file.mimetype
                }
            });
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        // Clean up file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.warn('File cleanup warning:', cleanupError.message);
            }
        }
        
        res.status(500).json({
            success: false,
            error: 'File processing failed',
            message: error.message
        });
    }
});

/**
 * POST /api/process-url
 * Process URL content with selected pattern
 */
router.post('/process-url', async (req, res) => {
    try {
        const { url, pattern, provider, model, options = {} } = req.body;
        
        if (!url || !pattern || !provider || !model) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['url', 'pattern', 'provider', 'model']
            });
        }
        
        // Scrape URL content
        const scraped = await unravelService.scrapeURL(url);
        
        const result = await unravelService.process({
            pattern,
            input: scraped.content,
            provider,
            model,
            options
        });
        
        if (result.success) {
            res.json({
                ...result,
                urlInfo: {
                    url: scraped.url,
                    title: scraped.title,
                    contentLength: scraped.length
                }
            });
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'URL processing failed',
            message: error.message
        });
    }
});

/**
 * POST /api/process-youtube
 * Process YouTube video with selected pattern
 */
router.post('/process-youtube', async (req, res) => {
    try {
        const { url, pattern, provider, model, options = {} } = req.body;
        
        if (!url || !pattern || !provider || !model) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['url', 'pattern', 'provider', 'model']
            });
        }
        
        // Validate YouTube URL
        if (!url.includes('youtube.com/watch') && !url.includes('youtu.be/')) {
            return res.status(400).json({
                error: 'Invalid YouTube URL'
            });
        }
        
        // Process YouTube content
        const youtubeData = await unravelService.processYouTube(url, {
            includeDescription: options.includeDescription !== false
        });
        
        const result = await unravelService.process({
            pattern,
            input: youtubeData.content,
            provider,
            model,
            options
        });
        
        if (result.success) {
            res.json({
                ...result,
                youtubeInfo: {
                    url: youtubeData.url,
                    title: youtubeData.title,
                    contentLength: youtubeData.length,
                    metadata: youtubeData.metadata
                }
            });
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'YouTube processing failed',
            message: error.message
        });
    }
});

/**
 * GET /api/settings
 * Get user settings from persistent storage
 */
router.get('/settings', async (req, res) => {
    try {
        const settings = await unravelService.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get settings',
            message: error.message
        });
    }
});

/**
 * POST /api/settings
 * Save user settings to persistent storage
 */
router.post('/settings', async (req, res) => {
    try {
        const settings = req.body;
        const result = await unravelService.saveSettings(settings);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to save settings',
            message: error.message
        });
    }
});

/**
 * POST /api/patterns/custom
 * Create or update a custom pattern
 */
router.post('/patterns/custom', async (req, res) => {
    try {
        const { name, category, description, content } = req.body;
        
        if (!name || !content) {
            return res.status(400).json({
                error: 'Pattern name and content are required'
            });
        }
        
        const result = await unravelService.saveCustomPattern(name, {
            category: category || 'custom',
            description: description || '',
            content,
            created: new Date().toISOString()
        });
        
        res.json({ success: true, pattern: result });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to save custom pattern',
            message: error.message
        });
    }
});

/**
 * DELETE /api/patterns/custom/:name
 * Delete a custom pattern
 */
router.delete('/patterns/custom/:name', async (req, res) => {
    try {
        const { name } = req.params;
        await unravelService.deleteCustomPattern(name);
        res.json({ success: true });
    } catch (error) {
        res.status(404).json({
            error: 'Failed to delete custom pattern',
            message: error.message
        });
    }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

module.exports = router;