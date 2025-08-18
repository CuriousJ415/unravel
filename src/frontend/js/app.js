/**
 * UNRAVEL Main Application
 * Personal AI pattern processor with clean, focused interface
 */

class UnravelApp {
    constructor() {
        this.isProcessing = false;
        this.currentResult = null;
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Unravel...');
            
            // Check system status
            await this.checkStatus();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup periodic status checks
            this.setupStatusChecks();
            
            console.log('✅ Unravel initialized successfully');
            showToast('Unravel is ready to process!', 'success');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            ui.updateStatus('offline', 'initialization failed');
            showToast(`Initialization failed: ${error.message}`, 'error');
        }
    }

    async checkStatus() {
        try {
            const status = await api.getStatus();
            
            if (status.status === 'online') {
                ui.updateStatus('online', `${status.patterns} patterns • ${status.providers.available}/${status.providers.total} providers`);
                return status;
            } else {
                throw new Error('Service offline');
            }
        } catch (error) {
            ui.updateStatus('offline', 'connection failed');
            throw error;
        }
    }

    async loadInitialData() {
        try {
            // Load patterns first
            const patternsData = await api.getPatterns().catch(e => ({ patterns: {} }));
            ui.populatePatterns(patternsData.patterns || {});

            // Configure providers with stored API keys if available
            let providersData;
            if (window.settingsManager && window.settingsManager.settings.apiKeys) {
                try {
                    providersData = await api.configureProviders(window.settingsManager.settings.apiKeys);
                } catch (error) {
                    console.warn('Provider configuration failed, falling back to default:', error);
                    providersData = await api.getProviders().catch(e => ({ providers: [] }));
                }
            } else {
                providersData = await api.getProviders().catch(e => ({ providers: [] }));
            }

            // Populate UI
            ui.populateProviders(providersData.providers || []);

            console.log(`📝 Loaded ${Object.keys(patternsData.patterns || {}).reduce((sum, cat) => sum + (patternsData.patterns[cat]?.length || 0), 0)} patterns`);
            console.log(`🤖 Found ${providersData.providers?.filter(p => p.status === 'available').length || 0} available providers`);

        } catch (error) {
            console.error('Failed to load initial data:', error);
            showToast('Failed to load patterns and providers', 'error');
        }
    }

    setupStatusChecks() {
        // Check status every 30 seconds when not processing
        setInterval(async () => {
            if (!this.isProcessing) {
                try {
                    await this.checkStatus();
                } catch (error) {
                    // Silent fail for background checks
                    console.warn('Background status check failed:', error.message);
                }
            }
        }, 30000);
    }

    async processInput() {
        if (this.isProcessing) {
            showToast('Processing already in progress...', 'warning');
            return;
        }

        try {
            const inputData = ui.getCurrentInput();
            this.validateInput(inputData);

            this.isProcessing = true;
            this.setProcessingState(true);
            
            ui.showLoading(`Processing with ${inputData.provider}...`);

            let result;
            const startTime = Date.now();

            // Process based on input type
            switch (ui.currentInputType) {
                case 'text':
                    result = await this.processText(inputData);
                    break;
                case 'file':
                    result = await this.processFile(inputData);
                    break;
                case 'url':
                    result = await this.processURL(inputData);
                    break;
                case 'youtube':
                    result = await this.processYouTube(inputData);
                    break;
                default:
                    throw new Error(`Unknown input type: ${ui.currentInputType}`);
            }

            const duration = Date.now() - startTime;
            
            if (result.success) {
                this.currentResult = result;
                ui.showResults(result);
                showToast(`Processing completed in ${(duration/1000).toFixed(1)}s`, 'success');
            } else {
                throw new Error(result.error || 'Processing failed');
            }

        } catch (error) {
            console.error('Processing failed:', error);
            ui.showError(error.message);
            showToast(`Processing failed: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.setProcessingState(false);
        }
    }

    validateInput(inputData) {
        const required = ['pattern', 'provider', 'model'];
        const missing = required.filter(field => !inputData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Type-specific validation
        switch (ui.currentInputType) {
            case 'text':
                if (!inputData.input?.trim()) {
                    throw new Error('Text input is required');
                }
                break;
            case 'file':
                if (!inputData.file) {
                    throw new Error('File selection is required');
                }
                break;
            case 'url':
                if (!inputData.url?.trim()) {
                    throw new Error('URL is required');
                }
                try {
                    new URL(inputData.url);
                } catch {
                    throw new Error('Valid URL is required');
                }
                break;
            case 'youtube':
                if (!inputData.url?.trim()) {
                    throw new Error('YouTube URL is required');
                }
                if (!inputData.url.includes('youtube.com/watch') && !inputData.url.includes('youtu.be/')) {
                    throw new Error('Valid YouTube URL is required');
                }
                break;
        }
    }

    async processText(inputData) {
        return api.processText({
            pattern: inputData.pattern,
            input: inputData.input,
            provider: inputData.provider,
            model: inputData.model,
            options: inputData.options
        });
    }

    async processFile(inputData) {
        ui.showLoading(`Uploading and processing file...`);
        
        return api.processFile(inputData.file, {
            pattern: inputData.pattern,
            provider: inputData.provider,
            model: inputData.model,
            options: JSON.stringify(inputData.options)
        });
    }

    async processURL(inputData) {
        ui.showLoading(`Scraping URL content...`);
        
        return api.processURL({
            url: inputData.url,
            pattern: inputData.pattern,
            provider: inputData.provider,
            model: inputData.model,
            options: inputData.options
        });
    }

    async processYouTube(inputData) {
        ui.showLoading(`Processing YouTube video...`);
        
        return api.processYouTube({
            url: inputData.url,
            pattern: inputData.pattern,
            provider: inputData.provider,
            model: inputData.model,
            options: inputData.options
        });
    }

    setProcessingState(processing) {
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.disabled = processing;
            
            const btnText = processBtn.querySelector('.btn-text');
            const btnIcon = processBtn.querySelector('.btn-icon');
            
            if (processing) {
                if (btnText) btnText.textContent = 'Processing...';
                if (btnIcon) btnIcon.textContent = '⏳';
                processBtn.style.opacity = '0.7';
            } else {
                if (btnText) btnText.textContent = 'Process';
                if (btnIcon) btnIcon.textContent = '⚡';
                processBtn.style.opacity = '1';
                ui.updateProcessButton(); // Re-check validity
            }
        }
    }

    // Result actions
    async copyResults() {
        if (!this.currentResult?.content) {
            showToast('No results to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentResult.content);
            showToast('Results copied to clipboard', 'success');
        } catch (error) {
            // Fallback for older browsers
            this.fallbackCopy(this.currentResult.content);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showToast('Results copied to clipboard', 'success');
        } catch (error) {
            showToast('Failed to copy results', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    downloadResults() {
        if (!this.currentResult?.content) {
            showToast('No results to download', 'error');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const pattern = this.currentResult.metadata?.pattern || 'result';
        const filename = `unravel-${pattern}-${timestamp}.txt`;

        const blob = new Blob([this.currentResult.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}`, 'success');
    }

    clearResults() {
        this.currentResult = null;
        
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
        
        showToast('Results cleared', 'info');
    }
}

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem;">×</button>
        </div>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// Global application instance
let app;

// Global functions for inline handlers
function processInput() {
    if (app) app.processInput();
}

function copyResults() {
    if (app) app.copyResults();
}

function downloadResults() {
    if (app) app.downloadResults();
}

function clearResults() {
    if (app) app.clearResults();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new UnravelApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && app) {
        // Page became visible, do a quick status check
        app.checkStatus().catch(console.warn);
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', (e) => {
    if (app && app.isProcessing) {
        e.preventDefault();
        e.returnValue = 'Processing is in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});