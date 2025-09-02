/**
 * UNRAVEL Core Service
 * Clean, focused implementation for personal AI pattern processing
 */

const fs = require('fs').promises;
const path = require('path');
const packageJson = require('../../../package.json');
const axios = require('axios');
const { OllamaProvider, OpenAIProvider, AnthropicProvider, OpenRouterProvider, GrokProvider } = require('./aiProviders');
const YTDlpWrap = require('yt-dlp-wrap').default;

class UnravelService {
    constructor() {
        this.patternsDir = path.join(__dirname, '../../../patterns');
        this.patterns = new Map();
        this.providers = {};
        
        this.initializeProviders();
        this.loadPatterns();
    }

    initializeProviders() {
        // Initialize available providers
        this.providers.ollama = new OllamaProvider(process.env.OLLAMA_BASE_URL);
        
        if (process.env.OPENAI_API_KEY) {
            this.providers.openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
        }
        
        if (process.env.ANTHROPIC_API_KEY) {
            this.providers.anthropic = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
        }
        
        if (process.env.OPENROUTER_API_KEY) {
            this.providers.openrouter = new OpenRouterProvider(process.env.OPENROUTER_API_KEY);
        }
        
        if (process.env.GROK_API_KEY) {
            this.providers.grok = new GrokProvider(process.env.GROK_API_KEY);
        }
    }

    async loadPatterns() {
        try {
            // Load built-in patterns
            await fs.access(this.patternsDir);
            const patternDirs = await fs.readdir(this.patternsDir);
            
            for (const dir of patternDirs) {
                const dirPath = path.join(this.patternsDir, dir);
                const stat = await fs.stat(dirPath);
                
                if (stat.isDirectory()) {
                    try {
                        const systemPath = path.join(dirPath, 'system.md');
                        const content = await fs.readFile(systemPath, 'utf8');
                        
                        // Try to read user.md if it exists for additional context
                        let userContext = '';
                        try {
                            const userPath = path.join(dirPath, 'user.md');
                            userContext = await fs.readFile(userPath, 'utf8');
                        } catch (err) {
                            // user.md is optional
                        }

                        this.patterns.set(dir, {
                            name: dir,
                            displayName: this.formatPatternName(dir),
                            content: content,
                            userContext: userContext,
                            category: this.categorizePattern(dir)
                        });
                    } catch (error) {
                        console.warn(`Failed to load pattern ${dir}:`, error.message);
                    }
                }
            }
            
            // Load custom patterns
            try {
                const customPatternsPath = path.join(__dirname, '../../../config/custom_patterns');
                await fs.access(customPatternsPath);
                const customPatternDirs = await fs.readdir(customPatternsPath);
                
                for (const dir of customPatternDirs) {
                    const dirPath = path.join(customPatternsPath, dir);
                    const stat = await fs.stat(dirPath);
                    
                    if (stat.isDirectory()) {
                        try {
                            const pattern = await this.loadCustomPattern(dirPath, dir);
                            if (pattern) {
                                this.patterns.set(dir, { ...pattern, custom: true });
                            }
                        } catch (error) {
                            console.warn(`Failed to load custom pattern ${dir}:`, error.message);
                        }
                    }
                }
            } catch (error) {
                // No custom patterns directory yet, that's fine
            }
            
            console.log(`✅ Loaded ${this.patterns.size} patterns`);
        } catch (error) {
            console.error('Failed to load patterns:', error.message);
            // Create patterns directory if it doesn't exist
            await fs.mkdir(this.patternsDir, { recursive: true });
        }
    }

    formatPatternName(patternName) {
        return patternName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    categorizePattern(patternName) {
        // Check for enhanced patterns first
        if (patternName.endsWith('_enhanced')) {
            return 'Enhanced';
        }

        const categories = {
            'Analysis': ['analyze', 'extract', 'review', 'rate', 'compare', 'check'],
            'Writing': ['summarize', 'improve', 'write', 'create_essay', 'tweet', 'formal'],
            'Media': ['youtube', 'video', 'transcript', 'image'],
            'Research': ['wisdom', 'paper', 'research', 'find', 'identify'],
            'Technical': ['code', 'coding', 'debug', 'explain_tech', 'security', 'threat'],
            'Creative': ['create', 'generate', 'design', 'story', 'art', 'logo']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => patternName.toLowerCase().includes(keyword))) {
                return category;
            }
        }
        return 'Other';
    }

    // Get available providers with their status
    async getProviders() {
        const result = [];
        
        for (const [key, provider] of Object.entries(this.providers)) {
            try {
                const models = await provider.getModels();
                result.push({
                    id: key,
                    name: provider.name,
                    type: provider.type,
                    status: 'available',
                    models: models
                });
            } catch (error) {
                result.push({
                    id: key,
                    name: provider.name,
                    type: provider.type,
                    status: 'error',
                    error: error.message,
                    models: []
                });
            }
        }
        
        return result;
    }

    // Configure providers with API keys
    async configureProviders(apiKeys) {
        // Always ensure Ollama is available
        if (!this.providers.ollama) {
            this.providers.ollama = new OllamaProvider(process.env.OLLAMA_BASE_URL);
        }

        // Configure online providers based on provided API keys
        if (apiKeys.openai && apiKeys.openai.trim()) {
            this.providers.openai = new OpenAIProvider(apiKeys.openai.trim());
        } else {
            delete this.providers.openai;
        }

        if (apiKeys.anthropic && apiKeys.anthropic.trim()) {
            this.providers.anthropic = new AnthropicProvider(apiKeys.anthropic.trim());
        } else {
            delete this.providers.anthropic;
        }

        if (apiKeys.openrouter && apiKeys.openrouter.trim()) {
            this.providers.openrouter = new OpenRouterProvider(apiKeys.openrouter.trim());
        } else {
            delete this.providers.openrouter;
        }

        if (apiKeys.grok && apiKeys.grok.trim()) {
            this.providers.grok = new GrokProvider(apiKeys.grok.trim());
        } else {
            delete this.providers.grok;
        }

        // Return updated provider list
        return this.getProviders();
    }

    // Get patterns organized by category
    getPatterns() {
        const categorized = {};
        
        for (const pattern of this.patterns.values()) {
            const category = pattern.category;
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push({
                id: pattern.name,
                name: pattern.displayName,
                description: this.extractDescription(pattern.content)
            });
        }
        
        // Sort patterns within each category
        for (const category of Object.keys(categorized)) {
            categorized[category].sort((a, b) => a.name.localeCompare(b.name));
        }
        
        return categorized;
    }

    extractDescription(content) {
        // Try to extract first line or paragraph as description
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
                return trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : '');
            }
        }
        return 'No description available';
    }

    // Get specific pattern content
    getPattern(patternName) {
        const pattern = this.patterns.get(patternName);
        if (!pattern) {
            throw new Error(`Pattern '${patternName}' not found`);
        }
        return pattern;
    }

    // Build complete prompt from pattern and input
    buildPrompt(pattern, userInput) {
        let prompt = pattern.content;
        
        // Add user context if available
        if (pattern.userContext) {
            prompt += '\n\n' + pattern.userContext;
        }
        
        // Add user input
        prompt += '\n\n' + userInput;
        
        return prompt;
    }

    // Core processing function
    async process({ pattern, input, provider, model, options = {} }) {
        try {
            // Validate inputs
            if (!pattern) throw new Error('Pattern is required');
            if (!input) throw new Error('Input is required');
            if (!provider) throw new Error('Provider is required');
            if (!model) throw new Error('Model is required');

            // Get pattern
            const patternData = this.getPattern(pattern);
            
            // Get provider
            const aiProvider = this.providers[provider];
            if (!aiProvider) {
                throw new Error(`Provider '${provider}' not available`);
            }
            
            // Build prompt
            const prompt = this.buildPrompt(patternData, input);
            
            // Generate response
            const startTime = Date.now();
            const result = await aiProvider.generate(prompt, model, options);
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                content: result.content,
                usage: result.usage,
                duration,
                metadata: {
                    pattern: pattern,
                    provider: provider,
                    model: model,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                metadata: {
                    pattern,
                    provider,
                    model,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    // URL scraping with Jina AI (preferred) and fallback
    async scrapeURL(url) {
        console.log('🔍 Starting URL scraping for:', url);
        
        // Get Jina API key from environment or settings
        let jinaApiKey = process.env.JINA_API_KEY;
        if (!jinaApiKey) {
            try {
                const settings = await this.getSettings();
                jinaApiKey = settings.apiKeys?.jina;
            } catch (error) {
                console.warn('Could not load settings for Jina API key:', error.message);
            }
        }
        
        // Try Jina AI first for clean, LLM-friendly text
        if (jinaApiKey) {
            console.log('🧠 Trying Jina AI with key:', jinaApiKey ? 'present' : 'missing');
            try {
                const jinaResponse = await axios.get(`https://r.jina.ai/${url}`, {
                    headers: {
                        'Authorization': `Bearer ${jinaApiKey}`,
                        'User-Agent': 'Unravel/1.0'
                    },
                    timeout: 15000
                });
                
                return {
                    url,
                    title: 'Jina processed content',
                    content: jinaResponse.data,
                    length: jinaResponse.data.length,
                    source: 'jina'
                };
            } catch (jinaError) {
                console.warn('🚨 Jina scraping failed, falling back to cheerio:', jinaError.message);
            }
        }
        
        // Fallback to cheerio scraping
        console.log('📄 Falling back to cheerio scraping');
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Unravel/1.0)'
                },
                timeout: 10000
            });
            
            const cheerio = require('cheerio');
            const $ = cheerio.load(response.data);
            
            // Remove script and style elements
            $('script, style').remove();
            
            // Get text content
            const text = $('body').text().replace(/\s+/g, ' ').trim();
            
            return {
                url,
                title: $('title').text() || 'No title',
                content: text,
                length: text.length,
                source: 'cheerio'
            };
        } catch (error) {
            console.error('❌ Cheerio scraping failed:', error.message, error.stack);
            throw new Error(`Failed to scrape URL: ${error.message}`);
        }
    }

    // Extract video ID from YouTube URL
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        
        throw new Error('Invalid YouTube URL');
    }

    // YouTube processing with YouTube API v3 and yt-dlp fallback
    async processYouTube(url, options = {}) {
        try {
            const videoId = this.extractVideoId(url);
            let metadata = {};
            let transcript = '';
            
            // Try YouTube API first if available
            if (process.env.YOUTUBE_API_KEY) {
                try {
                    // Get video metadata from YouTube API
                    const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                        params: {
                            part: 'snippet,statistics,contentDetails',
                            id: videoId,
                            key: process.env.YOUTUBE_API_KEY
                        }
                    });
                    
                    if (videoResponse.data.items && videoResponse.data.items.length > 0) {
                        const video = videoResponse.data.items[0];
                        const snippet = video.snippet;
                        const statistics = video.statistics;
                        
                        metadata = {
                            title: snippet.title,
                            description: snippet.description,
                            uploader: snippet.channelTitle,
                            upload_date: snippet.publishedAt,
                            view_count: parseInt(statistics.viewCount) || 0,
                            like_count: parseInt(statistics.likeCount) || 0,
                            duration: video.contentDetails.duration,
                            tags: snippet.tags || []
                        };
                        
                        // Try to get captions/transcript
                        try {
                            const captionsResponse = await axios.get('https://www.googleapis.com/youtube/v3/captions', {
                                params: {
                                    part: 'snippet',
                                    videoId: videoId,
                                    key: process.env.YOUTUBE_API_KEY
                                }
                            });
                            
                            // Note: Actual caption download requires OAuth, but we can note availability
                            if (captionsResponse.data.items && captionsResponse.data.items.length > 0) {
                                transcript = 'Captions available via YouTube API (requires OAuth for download)';
                            }
                        } catch (captionError) {
                            console.warn('Failed to get captions from YouTube API:', captionError.message);
                        }
                    }
                } catch (apiError) {
                    console.warn('YouTube API failed, falling back to yt-dlp:', apiError.message);
                }
            }
            
            // Fallback to yt-dlp if YouTube API didn't work or isn't configured
            if (!metadata.title) {
                try {
                    const ytDlp = new YTDlpWrap('/usr/bin/yt-dlp');
                    const info = await ytDlp.getVideoInfo(url);
                    
                    metadata = {
                        title: info.title || 'Unknown title',
                        duration: info.duration || 0,
                        uploader: info.uploader || 'Unknown',
                        upload_date: info.upload_date || 'Unknown',
                        view_count: info.view_count || 0,
                        description: info.description || ''
                    };
                    
                    // Try to get transcript with yt-dlp
                    try {
                        const subtitles = await ytDlp.execPromise([
                            url,
                            '--write-auto-sub',
                            '--write-sub',
                            '--sub-lang', 'en',
                            '--sub-format', 'vtt',
                            '--skip-download',
                            '--print', '%(subtitles)s'
                        ]);
                        transcript = subtitles || 'No transcript available';
                    } catch (subError) {
                        transcript = 'Transcript not available';
                    }
                } catch (ytDlpError) {
                    throw new Error(`Both YouTube API and yt-dlp failed: ${ytDlpError.message}`);
                }
            }
            
            // Build content
            let content = `Title: ${metadata.title}\n`;
            content += `Channel: ${metadata.uploader}\n`;
            content += `Upload Date: ${metadata.upload_date}\n`;
            content += `Views: ${metadata.view_count?.toLocaleString() || 'Unknown'}\n`;
            
            if (metadata.like_count) {
                content += `Likes: ${metadata.like_count.toLocaleString()}\n`;
            }
            
            if (metadata.duration) {
                content += `Duration: ${metadata.duration}\n`;
            }
            
            if (metadata.tags && metadata.tags.length > 0) {
                content += `Tags: ${metadata.tags.slice(0, 10).join(', ')}\n`;
            }
            
            content += '\n';
            
            if (options.includeDescription && metadata.description) {
                content += `Description:\n${metadata.description}\n\n`;
            }
            
            if (transcript && transcript !== 'Transcript not available') {
                content += `Transcript:\n${transcript}`;
            } else if (options.includeTranscript !== false) {
                content += 'Transcript: Not available for this video\n';
            }
            
            return {
                url,
                videoId,
                title: metadata.title,
                content,
                length: content.length,
                metadata,
                source: process.env.YOUTUBE_API_KEY ? 'youtube-api' : 'yt-dlp'
            };
            
        } catch (error) {
            throw new Error(`Failed to process YouTube video: ${error.message}`);
        }
    }

    // Settings persistence
    async getSettings() {
        try {
            const configPath = path.join(__dirname, '../../../config');
            await fs.mkdir(configPath, { recursive: true });
            
            const settingsPath = path.join(configPath, 'settings.json');
            
            try {
                const settingsData = await fs.readFile(settingsPath, 'utf8');
                const settings = JSON.parse(settingsData);
                
                // Merge with environment variables for API keys (env vars take precedence)
                const mergedSettings = {
                    ...settings,
                    apiKeys: {
                        ...settings.apiKeys,
                        ...(process.env.OPENAI_API_KEY && { openai: process.env.OPENAI_API_KEY }),
                        ...(process.env.ANTHROPIC_API_KEY && { anthropic: process.env.ANTHROPIC_API_KEY }),
                        ...(process.env.OPENROUTER_API_KEY && { openrouter: process.env.OPENROUTER_API_KEY }),
                        ...(process.env.GROK_API_KEY && { grok: process.env.GROK_API_KEY }),
                        ...(process.env.YOUTUBE_API_KEY && { youtube: process.env.YOUTUBE_API_KEY }),
                        ...(process.env.JINA_API_KEY && { jina: process.env.JINA_API_KEY })
                    }
                };
                
                return mergedSettings;
            } catch (error) {
                // File doesn't exist or is invalid, return default settings with env vars
                return this.getDefaultSettings();
            }
        } catch (error) {
            console.warn('Failed to get settings:', error.message);
            return this.getDefaultSettings();
        }
    }

    async saveSettings(settings) {
        try {
            const configPath = path.join(__dirname, '../../../config');
            await fs.mkdir(configPath, { recursive: true });
            
            const settingsPath = path.join(configPath, 'settings.json');
            
            // Don't save API keys that match environment variables
            const filteredSettings = {
                ...settings,
                apiKeys: {
                    ...settings.apiKeys
                }
            };
            
            // Remove API keys that match environment variables (they shouldn't be persisted)
            if (process.env.OPENAI_API_KEY && filteredSettings.apiKeys.openai === process.env.OPENAI_API_KEY) {
                delete filteredSettings.apiKeys.openai;
            }
            if (process.env.ANTHROPIC_API_KEY && filteredSettings.apiKeys.anthropic === process.env.ANTHROPIC_API_KEY) {
                delete filteredSettings.apiKeys.anthropic;
            }
            if (process.env.OPENROUTER_API_KEY && filteredSettings.apiKeys.openrouter === process.env.OPENROUTER_API_KEY) {
                delete filteredSettings.apiKeys.openrouter;
            }
            if (process.env.GROK_API_KEY && filteredSettings.apiKeys.grok === process.env.GROK_API_KEY) {
                delete filteredSettings.apiKeys.grok;
            }
            if (process.env.YOUTUBE_API_KEY && filteredSettings.apiKeys.youtube === process.env.YOUTUBE_API_KEY) {
                delete filteredSettings.apiKeys.youtube;
            }
            if (process.env.JINA_API_KEY && filteredSettings.apiKeys.jina === process.env.JINA_API_KEY) {
                delete filteredSettings.apiKeys.jina;
            }
            
            // Add metadata
            filteredSettings.lastUpdated = new Date().toISOString();
            filteredSettings.version = packageJson.version;
            
            await fs.writeFile(settingsPath, JSON.stringify(filteredSettings, null, 2), 'utf8');
            
            return {
                saved: true,
                path: settingsPath,
                timestamp: filteredSettings.lastUpdated
            };
        } catch (error) {
            throw new Error(`Failed to save settings: ${error.message}`);
        }
    }

    getDefaultSettings() {
        return {
            apiKeys: {
                openai: process.env.OPENAI_API_KEY || '',
                anthropic: process.env.ANTHROPIC_API_KEY || '',
                openrouter: process.env.OPENROUTER_API_KEY || '',
                grok: process.env.GROK_API_KEY || '',
                youtube: process.env.YOUTUBE_API_KEY || '',
                jina: process.env.JINA_API_KEY || ''
            },
            preferences: {
                saveResults: true,
                showAdvanced: false
            },
            patterns: {
                enabled: {},
                custom: {}
            },
            version: packageJson.version,
            created: new Date().toISOString()
        };
    }

    // Custom pattern management
    async saveCustomPattern(name, patternData) {
        try {
            const customPatternsPath = path.join(__dirname, '../../../config/custom_patterns');
            await fs.mkdir(customPatternsPath, { recursive: true });
            
            const patternDir = path.join(customPatternsPath, name);
            await fs.mkdir(patternDir, { recursive: true });
            
            const systemPath = path.join(patternDir, 'system.md');
            await fs.writeFile(systemPath, patternData.content, 'utf8');
            
            // Save metadata
            const metadataPath = path.join(patternDir, 'metadata.json');
            const metadata = {
                name,
                category: patternData.category,
                description: patternData.description,
                created: patternData.created || new Date().toISOString(),
                updated: new Date().toISOString(),
                custom: true
            };
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
            
            // Update patterns in memory
            this.patterns.set(name, {
                name,
                category: patternData.category,
                description: patternData.description,
                system: patternData.content,
                custom: true
            });
            
            return metadata;
        } catch (error) {
            throw new Error(`Failed to save custom pattern: ${error.message}`);
        }
    }

    async deleteCustomPattern(name) {
        try {
            const customPatternsPath = path.join(__dirname, '../../../config/custom_patterns');
            const patternDir = path.join(customPatternsPath, name);
            
            // Remove directory and all contents
            await fs.rm(patternDir, { recursive: true, force: true });
            
            // Remove from memory
            this.patterns.delete(name);
            
            return true;
        } catch (error) {
            throw new Error(`Failed to delete custom pattern: ${error.message}`);
        }
    }


    async loadCustomPattern(patternDir, patternName) {
        try {
            const systemFile = path.join(patternDir, 'system.md');
            const metadataFile = path.join(patternDir, 'metadata.json');
            
            let metadata = {};
            try {
                const metadataContent = await fs.readFile(metadataFile, 'utf8');
                metadata = JSON.parse(metadataContent);
            } catch (error) {
                // No metadata file, create basic metadata
                metadata = {
                    name: patternName,
                    category: 'custom',
                    description: 'Custom pattern',
                    created: new Date().toISOString()
                };
            }
            
            const systemContent = await fs.readFile(systemFile, 'utf8');
            
            return {
                name: patternName,
                category: metadata.category || 'custom',
                description: metadata.description || 'Custom pattern',
                system: systemContent,
                user: '', // Custom patterns might not have user prompts
                custom: true
            };
        } catch (error) {
            throw error;
        }
    }

    // Health check
    async getStatus() {
        const providers = await this.getProviders();
        const availableProviders = providers.filter(p => p.status === 'available').length;
        
        return {
            status: 'online',
            version: packageJson.version,
            patterns: this.patterns.size,
            providers: {
                total: providers.length,
                available: availableProviders,
                details: providers
            },
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new UnravelService();