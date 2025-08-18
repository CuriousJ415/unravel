/**
 * UNRAVEL UI Manager
 * Clean interface management for better UX
 */

class UIManager {
    constructor() {
        this.currentInputType = 'text';
        this.selectedFile = null;
        this.currentPattern = null;
        this.currentProvider = null;
        this.providers = new Map();
        this.patterns = new Map();
        this.currentPatternTab = 'preview';
        this.originalPatternContent = '';
        this.editedPatternContent = '';
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload handling
        this.setupFileUpload();
        
        // Advanced options
        this.setupAdvancedOptions();
        
        // Input validation
        this.setupValidation();
    }

    setupFileUpload() {
        const fileDropZone = document.getElementById('fileDropZone');
        const fileSelector = document.getElementById('fileSelector');
        
        if (!fileDropZone || !fileSelector) return;

        // Click to select file
        fileDropZone.addEventListener('click', () => {
            fileSelector.click();
        });

        // File selection
        fileSelector.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });

        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        fileDropZone.addEventListener('dragenter', () => {
            fileDropZone.classList.add('dragover');
        });

        fileDropZone.addEventListener('dragleave', (e) => {
            if (!fileDropZone.contains(e.relatedTarget)) {
                fileDropZone.classList.remove('dragover');
            }
        });

        fileDropZone.addEventListener('drop', (e) => {
            fileDropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelection(e.dataTransfer.files[0]);
            }
        });
    }

    setupAdvancedOptions() {
        const temperature = document.getElementById('temperature');
        if (temperature) {
            const valueDisplay = temperature.nextElementSibling;
            temperature.addEventListener('input', (e) => {
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value;
                }
            });
        }
    }

    setupValidation() {
        const urlField = document.getElementById('urlField');
        const youtubeField = document.getElementById('youtubeField');
        
        if (urlField) {
            urlField.addEventListener('input', this.debounce((e) => {
                this.validateURL(e.target.value);
            }, 500));
        }
        
        if (youtubeField) {
            console.log('Adding YouTube field event listeners');
            youtubeField.addEventListener('input', (e) => {
                console.log('YouTube field input detected');
                this.updateProcessButton();
            });
            
            // Also listen for paste events
            youtubeField.addEventListener('paste', () => {
                console.log('YouTube field paste detected');
                // Use setTimeout to wait for paste content to be available
                setTimeout(() => {
                    this.updateProcessButton();
                }, 10);
            });
        }
        
        // Add similar listeners for text area and URL field
        const textArea = document.getElementById('textArea');
        if (textArea) {
            textArea.addEventListener('input', () => {
                this.updateProcessButton();
            });
            
            textArea.addEventListener('paste', () => {
                setTimeout(() => {
                    this.updateProcessButton();
                }, 10);
            });
        }
        
        if (urlField) {
            urlField.addEventListener('input', () => {
                this.updateProcessButton();
            });
            
            urlField.addEventListener('paste', () => {
                setTimeout(() => {
                    this.updateProcessButton();
                }, 10);
            });
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Status management
    updateStatus(status, text) {
        const indicator = document.getElementById('statusIndicator');
        if (!indicator) return;

        const dot = indicator.querySelector('.status-dot');
        const textEl = indicator.querySelector('.status-text');

        if (dot) {
            dot.className = `status-dot ${status}`;
        }
        if (textEl) {
            textEl.textContent = text;
        }
    }

    // Input type switching
    switchInputType(type) {
        this.currentInputType = type;

        // Update tabs
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            }
        });

        // Update content visibility
        document.querySelectorAll('.input-content').forEach(content => {
            content.style.display = 'none';
        });

        const activeContent = document.getElementById(`${type}Input`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }

        this.updateProcessButton();
    }

    // Pattern management
    populatePatterns(patterns) {
        const select = document.getElementById('patternSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Select a pattern...</option>';
        
        Object.entries(patterns).forEach(([category, categoryPatterns]) => {
            if (categoryPatterns.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;
                
                categoryPatterns.forEach(pattern => {
                    const option = document.createElement('option');
                    option.value = pattern.id;
                    option.textContent = pattern.name;
                    option.title = pattern.description;
                    optgroup.appendChild(option);
                    
                    this.patterns.set(pattern.id, pattern);
                });
                
                select.appendChild(optgroup);
            }
        });
    }

    async onPatternChange(patternId) {
        this.currentPattern = patternId;
        
        if (!patternId) {
            this.hidePatternPreview();
            this.updateProcessButton();
            return;
        }

        try {
            const pattern = await api.getPattern(patternId);
            this.originalPatternContent = pattern.content;
            this.editedPatternContent = pattern.content;
            this.showPatternPreview(pattern);
            this.updatePatternEditor();
        } catch (error) {
            showToast(`Failed to load pattern: ${error.message}`, 'error');
            this.hidePatternPreview();
        }
        
        this.updateProcessButton();
    }

    showPatternPreview(pattern) {
        const preview = document.getElementById('patternPreview');
        const content = document.getElementById('patternContent');
        
        if (preview && content) {
            content.textContent = pattern.content.substring(0, 500) + 
                (pattern.content.length > 500 ? '...' : '');
            preview.style.display = 'block';
        }
    }

    hidePatternPreview() {
        const preview = document.getElementById('patternPreview');
        if (preview) {
            preview.style.display = 'none';
        }
    }

    // Pattern tab management
    switchPatternTab(tabType) {
        this.currentPatternTab = tabType;
        
        // Update tab buttons
        document.querySelectorAll('.pattern-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === tabType) {
                tab.classList.add('active');
            }
        });

        // Update tab content
        const previewContent = document.getElementById('patternPreviewContent');
        const editContent = document.getElementById('patternEditContent');

        if (tabType === 'preview') {
            if (previewContent) previewContent.style.display = 'block';
            if (editContent) editContent.style.display = 'none';
        } else if (tabType === 'edit') {
            if (previewContent) previewContent.style.display = 'none';
            if (editContent) editContent.style.display = 'block';
            this.updatePatternEditor();
        }
    }

    updatePatternEditor() {
        const editor = document.getElementById('patternEditor');
        if (editor) {
            editor.value = this.editedPatternContent;
            
            // Add event listener for changes
            editor.removeEventListener('input', this.handlePatternEdit);
            editor.addEventListener('input', this.handlePatternEdit.bind(this));
        }
    }

    handlePatternEdit(event) {
        this.editedPatternContent = event.target.value;
        
        // Update preview if it's been edited
        const content = document.getElementById('patternContent');
        if (content) {
            const truncated = this.editedPatternContent.substring(0, 500);
            content.textContent = truncated + (this.editedPatternContent.length > 500 ? '...' : '');
        }
    }

    resetPattern() {
        if (confirm('Reset pattern to original? Any edits will be lost.')) {
            this.editedPatternContent = this.originalPatternContent;
            this.updatePatternEditor();
            
            // Update preview
            const content = document.getElementById('patternContent');
            if (content) {
                const truncated = this.editedPatternContent.substring(0, 500);
                content.textContent = truncated + (this.editedPatternContent.length > 500 ? '...' : '');
            }
            
            showToast('Pattern reset to original', 'info');
        }
    }

    saveCustomPattern() {
        const patternName = prompt('Enter name for custom pattern:');
        if (patternName && patternName.trim()) {
            const customPattern = {
                id: 'custom_' + patternName.toLowerCase().replace(/\s+/g, '_'),
                name: patternName,
                content: this.editedPatternContent,
                category: 'Custom',
                isCustom: true,
                created: new Date().toISOString()
            };

            // Save to localStorage
            const customPatterns = JSON.parse(localStorage.getItem('unravel_custom_patterns') || '[]');
            customPatterns.push(customPattern);
            localStorage.setItem('unravel_custom_patterns', JSON.stringify(customPatterns));

            showToast(`Custom pattern "${patternName}" saved`, 'success');
        }
    }

    getCurrentPatternContent() {
        // Return edited content if in edit mode and has changes, otherwise original
        return this.editedPatternContent !== this.originalPatternContent ? 
            this.editedPatternContent : this.originalPatternContent;
    }

    // Provider management
    populateProviders(providers) {
        console.log('UI populateProviders called with:', providers);
        const select = document.getElementById('providerSelect');
        if (!select) {
            console.error('Provider select element not found');
            return;
        }

        select.innerHTML = '<option value="">Select provider...</option>';
        
        providers.forEach(provider => {
            console.log('Processing provider:', provider);
            this.providers.set(provider.id, provider);
            
            if (provider.status === 'available') {
                const option = document.createElement('option');
                option.value = provider.id;
                option.textContent = `${provider.name} (${provider.type})`;
                select.appendChild(option);
                console.log('Added provider option:', provider.name);
            } else {
                console.log('Provider not available:', provider.name, provider.status);
            }
        });
        
        console.log('Final provider select HTML:', select.innerHTML);
    }

    async onProviderChange(providerId) {
        this.currentProvider = providerId;
        const modelSelect = document.getElementById('modelSelect');
        
        if (!modelSelect) return;
        
        modelSelect.innerHTML = '<option value="">Select model...</option>';
        
        if (!providerId) {
            this.updateProcessButton();
            return;
        }

        const provider = this.providers.get(providerId);
        if (provider && provider.models) {
            provider.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                if (model.context_length) {
                    option.title = `Context: ${model.context_length.toLocaleString()} tokens`;
                }
                modelSelect.appendChild(option);
            });
            
            // Select first model if available
            if (provider.models.length > 0) {
                modelSelect.value = provider.models[0].id;
            }
        }
        
        this.updateProcessButton();
    }

    // File handling
    handleFileSelection(file) {
        if (!this.isValidFile(file)) {
            showToast(`Invalid file type: ${file.type}`, 'error');
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB
            showToast('File too large (max 50MB)', 'error');
            return;
        }

        this.selectedFile = file;
        this.showFileInfo(file);
        this.updateProcessButton();
    }

    isValidFile(file) {
        const allowedTypes = [
            'text/plain', 'text/markdown', 'text/csv',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/json'
        ];
        
        return allowedTypes.includes(file.type) || file.type.startsWith('text/');
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            fileInfo.style.display = 'block';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile() {
        this.selectedFile = null;
        const fileInfo = document.getElementById('fileInfo');
        const fileSelector = document.getElementById('fileSelector');
        
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        if (fileSelector) {
            fileSelector.value = '';
        }
        
        this.updateProcessButton();
    }

    // URL validation
    validateURL(url) {
        const urlInfo = document.getElementById('urlInfo');
        if (!urlInfo) return;

        if (!url) {
            urlInfo.innerHTML = '';
            return;
        }

        try {
            new URL(url);
            urlInfo.innerHTML = '<span style="color: var(--success)">✓ Valid URL</span>';
        } catch {
            urlInfo.innerHTML = '<span style="color: var(--error)">✗ Invalid URL</span>';
        }
    }

    // Process button state
    updateProcessButton() {
        const button = document.getElementById('processBtn');
        if (!button) return;

        const hasInput = this.hasValidInput();
        const hasPattern = !!this.currentPattern;
        const hasProvider = !!document.getElementById('providerSelect')?.value;
        const hasModel = !!document.getElementById('modelSelect')?.value;

        const isValid = hasInput && hasPattern && hasProvider && hasModel;
        
        button.disabled = !isValid;
        
        if (!isValid) {
            let missing = [];
            if (!hasInput) missing.push('input');
            if (!hasPattern) missing.push('pattern');
            if (!hasProvider) missing.push('provider');
            if (!hasModel) missing.push('model');
            
            button.title = `Missing: ${missing.join(', ')}`;
        } else {
            button.title = 'Process with AI';
        }
    }

    hasValidInput() {
        switch (this.currentInputType) {
            case 'text':
                const textArea = document.getElementById('textArea');
                return textArea && textArea.value.trim().length > 0;
            
            case 'file':
                return !!this.selectedFile;
            
            case 'url':
                const urlField = document.getElementById('urlField');
                if (!urlField || !urlField.value.trim()) return false;
                try {
                    new URL(urlField.value);
                    return true;
                } catch {
                    return false;
                }
            
            case 'youtube':
                const youtubeField = document.getElementById('youtubeField');
                if (!youtubeField || !youtubeField.value.trim()) return false;
                const url = youtubeField.value.trim();
                return url.includes('youtube.com/watch') || url.includes('youtu.be/');
            
            default:
                return false;
        }
    }

    // Get current input data
    getCurrentInput() {
        const pattern = document.getElementById('patternSelect')?.value;
        const provider = document.getElementById('providerSelect')?.value;
        const model = document.getElementById('modelSelect')?.value;
        
        const options = {
            temperature: parseFloat(document.getElementById('temperature')?.value || 0.7),
            max_tokens: parseInt(document.getElementById('maxTokens')?.value || 2048)
        };

        const base = { pattern, provider, model, options };

        switch (this.currentInputType) {
            case 'text':
                return {
                    ...base,
                    input: document.getElementById('textArea')?.value || ''
                };
            
            case 'file':
                return {
                    ...base,
                    file: this.selectedFile
                };
            
            case 'url':
                return {
                    ...base,
                    url: document.getElementById('urlField')?.value || ''
                };
            
            case 'youtube':
                return {
                    ...base,
                    url: document.getElementById('youtubeField')?.value || '',
                    options: {
                        ...options,
                        includeDescription: document.getElementById('includeDescription')?.checked,
                        includeTranscript: document.getElementById('includeTranscript')?.checked
                    }
                };
            
            default:
                return base;
        }
    }

    // Results display
    showLoading(details = '') {
        const resultsSection = document.getElementById('resultsSection');
        const loadingState = document.getElementById('loadingState');
        const results = document.getElementById('results');
        const loadingDetails = document.getElementById('loadingDetails');
        
        if (resultsSection) resultsSection.style.display = 'block';
        if (loadingState) loadingState.style.display = 'block';
        if (results) results.style.display = 'none';
        if (loadingDetails) loadingDetails.textContent = details;
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    showResults(result) {
        this.hideLoading();
        
        const results = document.getElementById('results');
        const resultsText = document.getElementById('resultsText');
        const resultsMetadata = document.getElementById('resultsMetadata');
        const resultsSection = document.getElementById('resultsSection');
        
        if (resultsSection) resultsSection.style.display = 'block';
        if (results) results.style.display = 'block';
        
        if (resultsText) {
            resultsText.textContent = result.content;
        }
        
        if (resultsMetadata && result.metadata) {
            const metadata = [
                `Pattern: ${result.metadata.pattern}`,
                `Provider: ${result.metadata.provider}`,
                `Model: ${result.metadata.model}`,
                `Duration: ${result.duration}ms`,
                result.usage ? `Tokens: ${result.usage.total_tokens || 'N/A'}` : null
            ].filter(Boolean);
            
            resultsMetadata.textContent = metadata.join(' • ');
        }
    }

    showError(error) {
        this.hideLoading();
        
        const results = document.getElementById('results');
        const resultsText = document.getElementById('resultsText');
        
        if (results) results.style.display = 'block';
        
        if (resultsText) {
            resultsText.innerHTML = `<div style="color: var(--error); padding: 1rem; background: var(--bg-accent); border-radius: var(--radius); border-left: 4px solid var(--error);">
                <strong>Error:</strong> ${error}
            </div>`;
        }
    }
}

// Global UI manager
const ui = new UIManager();

// Global functions for inline handlers
function switchInputType(type) {
    ui.switchInputType(type);
}

function onPatternChange(value) {
    ui.onPatternChange(value);
}

function onProviderChange(value) {
    ui.onProviderChange(value);
}

function removeFile() {
    ui.removeFile();
}

// Pattern editor functions
function switchPatternTab(type) {
    ui.switchPatternTab(type);
}

function resetPattern() {
    ui.resetPattern();
}

function savePattern() {
    ui.saveCustomPattern();
}