/**
 * UNRAVEL Settings Manager
 * API key management and user preferences
 */

class SettingsManager {
    constructor() {
        this.storageKey = 'unravel_settings';
        this.settings = this.getDefaultSettings();
        this.initialized = false;
        this.initializeAsync();
        this.initializeEventListeners();
    }

    async initializeAsync() {
        try {
            this.settings = await this.loadSettings();
            this.initialized = true;
            console.log('Settings manager initialized with:', this.settings);
        } catch (error) {
            console.error('Settings initialization failed:', error);
            this.settings = this.getDefaultSettings();
            this.initialized = true;
        }
    }

    initializeEventListeners() {
        // API key validation on input
        const apiKeyInputs = [
            'openaiKey', 'anthropicKey', 'openrouterKey', 
            'grokKey', 'youtubeKey', 'jinaKey'
        ];

        apiKeyInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', this.debounce((e) => {
                    this.validateApiKey(inputId, e.target.value);
                }, 500));

                input.addEventListener('blur', (e) => {
                    this.validateApiKey(inputId, e.target.value);
                });
            }
        });

        // Preference checkboxes
        const saveResults = document.getElementById('saveResults');
        const showAdvanced = document.getElementById('showAdvanced');

        if (saveResults) {
            saveResults.addEventListener('change', (e) => {
                this.updatePreference('saveResults', e.target.checked);
            });
        }

        if (showAdvanced) {
            showAdvanced.addEventListener('change', (e) => {
                this.updatePreference('showAdvanced', e.target.checked);
                this.toggleAdvancedOptions(e.target.checked);
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

    async loadSettings() {
        try {
            // Try to load from backend first
            if (window.api) {
                try {
                    const response = await fetch('/api/settings');
                    if (response.ok) {
                        const backendSettings = await response.json();
                        console.log('Loaded settings from backend:', backendSettings);
                        
                        // Merge with localStorage for any local-only settings
                        const localSettings = this.loadLocalSettings();
                        const mergedSettings = {
                            ...this.getDefaultSettings(),
                            ...backendSettings,
                            ...localSettings
                        };
                        
                        // Ensure patterns structure exists
                        if (!mergedSettings.patterns) {
                            mergedSettings.patterns = { enabled: {}, custom: {} };
                        }
                        
                        // Save to localStorage as cache
                        localStorage.setItem(this.storageKey, JSON.stringify(mergedSettings));
                        return mergedSettings;
                    }
                } catch (error) {
                    console.warn('Backend settings unavailable, using localStorage:', error.message);
                }
            }
            
            // Fallback to localStorage
            return this.loadLocalSettings();
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    loadLocalSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const settings = stored ? JSON.parse(stored) : this.getDefaultSettings();
            
            // Ensure patterns structure exists
            if (!settings.patterns) {
                settings.patterns = { enabled: {}, custom: {} };
            }
            
            return settings;
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            apiKeys: {
                openai: '',
                anthropic: '',
                openrouter: '',
                grok: '',
                youtube: '',
                jina: ''
            },
            preferences: {
                saveResults: true,
                showAdvanced: false
            },
            patterns: {
                enabled: {}, // Pattern name -> boolean
                custom: {} // Custom patterns
            }
        };
    }

    async saveSettings() {
        try {
            // Save to backend first if available
            let backendSaved = false;
            if (window.api) {
                try {
                    const response = await fetch('/api/settings', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(this.settings)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Settings saved to backend:', result);
                        backendSaved = true;
                    }
                } catch (error) {
                    console.warn('Backend save failed, using localStorage only:', error.message);
                }
            }
            
            // Always save to localStorage as backup/cache
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            
            if (backendSaved) {
                console.log('Settings saved to both backend and localStorage');
            } else {
                console.log('Settings saved to localStorage only');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            showToast('Failed to save settings', 'error');
            return false;
        }
    }

    updateApiKey(provider, key) {
        this.settings.apiKeys[provider] = key;
        return this.saveSettings();
    }

    updatePreference(key, value) {
        this.settings.preferences[key] = value;
        return this.saveSettings();
    }

    validateApiKey(inputId, key) {
        const provider = inputId.replace('Key', '');
        const statusElement = document.getElementById(`${provider}Status`);
        
        if (!statusElement) return;

        if (!key || key.trim().length === 0) {
            statusElement.textContent = '❌';
            statusElement.className = 'key-status invalid';
            statusElement.title = 'No API key provided';
            return false;
        }

        // Basic validation patterns for different providers
        const patterns = {
            openai: /^sk-[a-zA-Z0-9]{48,}$/,
            anthropic: /^sk-ant-[a-zA-Z0-9-_]{95,}$/,
            openrouter: /^sk-or-[a-zA-Z0-9-_]{32,}$/,
            grok: /^xai-[a-zA-Z0-9]{32,}$/,
            youtube: /^AIza[a-zA-Z0-9_-]{35}$/,
            jina: /^jina_[a-zA-Z0-9]{32,}$/
        };

        const pattern = patterns[provider];
        const isValid = pattern ? pattern.test(key.trim()) : key.trim().length > 10;

        if (isValid) {
            statusElement.textContent = '✅';
            statusElement.className = 'key-status valid';
            statusElement.title = 'API key format looks valid';
        } else {
            statusElement.textContent = '⚠️';
            statusElement.className = 'key-status invalid';
            statusElement.title = 'API key format appears invalid';
        }

        return isValid;
    }

    populateForm() {
        // Populate API keys
        Object.entries(this.settings.apiKeys).forEach(([provider, key]) => {
            const input = document.getElementById(`${provider}Key`);
            if (input) {
                input.value = key;
                this.validateApiKey(`${provider}Key`, key);
            }
        });

        // Populate preferences
        Object.entries(this.settings.preferences).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element && element.type === 'checkbox') {
                element.checked = value;
            }
        });

        // Apply advanced options visibility
        this.toggleAdvancedOptions(this.settings.preferences.showAdvanced);
        
        // Don't populate pattern toggles here - they'll be populated when UI loads patterns
    }

    collectFormData() {
        const formData = {
            apiKeys: {},
            preferences: {}
        };

        // Collect API keys
        const apiKeyInputs = [
            'openaiKey', 'anthropicKey', 'openrouterKey', 
            'grokKey', 'youtubeKey', 'jinaKey'
        ];

        apiKeyInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                const provider = inputId.replace('Key', '');
                formData.apiKeys[provider] = input.value.trim();
            }
        });

        // Collect preferences
        const saveResults = document.getElementById('saveResults');
        const showAdvanced = document.getElementById('showAdvanced');

        if (saveResults) {
            formData.preferences.saveResults = saveResults.checked;
        }
        if (showAdvanced) {
            formData.preferences.showAdvanced = showAdvanced.checked;
        }

        return formData;
    }

    toggleAdvancedOptions(show) {
        const advancedOptions = document.querySelector('.advanced-options');
        if (advancedOptions) {
            advancedOptions.style.display = show ? 'block' : 'none';
        }
    }

    getConfiguredProviders() {
        const configured = [];
        
        Object.entries(this.settings.apiKeys).forEach(([provider, key]) => {
            if (key && key.trim().length > 0 && this.validateApiKey(`${provider}Key`, key)) {
                configured.push(provider);
            }
        });

        return configured;
    }

    hasApiKey(provider) {
        return this.settings.apiKeys[provider] && this.settings.apiKeys[provider].trim().length > 0;
    }

    getApiKey(provider) {
        return this.settings.apiKeys[provider] || '';
    }

    clearAllKeys() {
        if (confirm('Are you sure you want to clear all API keys? This action cannot be undone.')) {
            this.settings.apiKeys = this.getDefaultSettings().apiKeys;
            this.saveSettings();
            this.populateForm();
            showToast('All API keys cleared', 'info');
            
            // Trigger provider refresh with empty keys
            if (api && ui) {
                api.configureProviders(this.settings.apiKeys).then(providersData => {
                    ui.populateProviders(providersData.providers || []);
                    showToast('Providers updated - only local providers available', 'info');
                }).catch(error => {
                    console.error('Provider refresh failed:', error);
                });
            }
        }
    }
}

// Global settings manager
const settingsManager = new SettingsManager();

// Global functions for inline handlers
function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        settingsManager.populateForm();
        modal.style.display = 'flex';
        
        // Focus first input
        const firstInput = modal.querySelector('input[type="password"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveSettings() {
    const formData = settingsManager.collectFormData();
    
    console.log('Saving settings with form data:', formData);
    
    // Validate at least one API key is provided
    const hasAnyKey = Object.values(formData.apiKeys).some(key => key.trim().length > 0);
    
    if (!hasAnyKey) {
        if (!confirm('No API keys provided. You will only be able to use local Ollama providers. Continue?')) {
            return;
        }
    }

    // Update settings
    settingsManager.settings = formData;
    
    if (settingsManager.saveSettings()) {
        showToast('Settings saved successfully', 'success');
        closeSettings();
        
        // Configure providers with new API keys
        if (api) {
            console.log('Configuring providers with API keys:', formData.apiKeys);
            try {
                api.configureProviders(formData.apiKeys).then(providersData => {
                    console.log('Received provider data:', providersData);
                    if (ui && providersData.providers) {
                        ui.populateProviders(providersData.providers);
                        const availableCount = providersData.providers.filter(p => p.status === 'available').length;
                        showToast(`Updated providers: ${availableCount} available`, 'info');
                        console.log('UI updated with providers');
                    } else {
                        console.error('UI manager or provider data not available');
                    }
                }).catch(error => {
                    console.error('Provider update failed:', error);
                    showToast('Settings saved, but provider update failed', 'warning');
                });
            } catch (error) {
                console.error('Provider configuration error:', error);
            }
        } else {
            console.error('API client not available');
        }
    }
}

function clearAllKeys() {
    settingsManager.clearAllKeys();
}

// SettingsManager class continuation - Pattern Management Methods
SettingsManager.prototype.populatePatternToggles = function() {
    const toggleList = document.getElementById('patternToggleList');
    if (!toggleList) return;

    // Ensure patterns structure exists
    if (!this.settings.patterns) {
        this.settings.patterns = { enabled: {}, custom: {} };
    }
    if (!this.settings.patterns.enabled) {
        this.settings.patterns.enabled = {};
    }
    if (!this.settings.patterns.custom) {
        this.settings.patterns.custom = {};
    }

    // Get patterns from UI manager if available
    const allPatterns = window.ui?.patterns || {};
    const enabledPatterns = this.settings.patterns.enabled;
    const customPatterns = this.settings.patterns.custom;
    
    console.log('populatePatternToggles - allPatterns:', allPatterns);
    console.log('populatePatternToggles - enabledPatterns:', enabledPatterns);
    
    toggleList.innerHTML = '';

    // Create pattern categories
    Object.entries(allPatterns).forEach(([category, patterns]) => {
        if (patterns && patterns.length > 0) {
            this.createPatternCategory(toggleList, category, patterns, enabledPatterns, false);
        }
    });

    // Add custom patterns category if any exist
    if (Object.keys(customPatterns).length > 0) {
        const customPatternsList = Object.entries(customPatterns).map(([name, data]) => ({
            name,
            description: data.description || 'Custom pattern'
        }));
        this.createPatternCategory(toggleList, 'custom', customPatternsList, enabledPatterns, true);
    }
};

SettingsManager.prototype.createPatternCategory = function(container, category, patterns, enabledPatterns, isCustom) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'pattern-category';
    
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'pattern-category-title';
    categoryTitle.textContent = this.formatCategoryName(category);
    categoryDiv.appendChild(categoryTitle);

    patterns.forEach(pattern => {
        // Use the same ID logic as the dropdown
        const patternId = pattern.id || pattern.name || pattern;
        const patternDisplayName = pattern.name || pattern.displayName || pattern;
        const description = pattern.description || this.getPatternDescription(patternId);
        // If never set, default to enabled (true). Otherwise use stored value.
        const isEnabled = enabledPatterns.hasOwnProperty(patternId) ? enabledPatterns[patternId] : true;
        
        const patternItem = document.createElement('div');
        patternItem.className = 'pattern-item';
        
        patternItem.innerHTML = `
            <div class="pattern-info">
                <div class="pattern-name">
                    ${patternDisplayName}
                    ${isCustom ? '<span class="custom-pattern-badge">CUSTOM</span>' : ''}
                </div>
                <div class="pattern-description">${description}</div>
            </div>
            <div class="pattern-toggle">
                <input type="checkbox" id="pattern_${patternId}" 
                       ${isEnabled ? 'checked' : ''} 
                       onchange="settingsManager.togglePattern('${patternId}', this.checked)">
            </div>
        `;
        
        categoryDiv.appendChild(patternItem);
    });
    
    container.appendChild(categoryDiv);
};

SettingsManager.prototype.formatCategoryName = function(category) {
    return category.replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());
};

SettingsManager.prototype.getPatternDescription = function(patternName) {
    // Basic descriptions for common patterns
    const descriptions = {
        'summarize': 'Create concise summaries of content',
        'extract_wisdom': 'Extract insights and wisdom from text',
        'improve_writing': 'Enhance and polish written content',
        'explain_concepts': 'Explain complex topics simply',
        'analyze_claims': 'Fact-check and analyze claims',
        'extract_insights': 'Pull key insights from content'
    };
    return descriptions[patternName] || 'AI pattern for text processing';
};

SettingsManager.prototype.togglePattern = function(patternName, enabled) {
    // Ensure patterns structure exists
    if (!this.settings.patterns) {
        this.settings.patterns = { enabled: {}, custom: {} };
    }
    if (!this.settings.patterns.enabled) {
        this.settings.patterns.enabled = {};
    }
    
    this.settings.patterns.enabled[patternName] = enabled;
    this.saveSettings();
    
    // Update the main UI pattern dropdown if UI manager exists
    if (window.ui && window.ui.populatePatterns) {
        const filteredPatterns = this.getEnabledPatterns();
        window.ui.populatePatterns(filteredPatterns);
    }
    
    // Don't refresh the settings toggles - that would hide the unchecked patterns!
};

SettingsManager.prototype.getEnabledPatterns = function() {
    const allPatterns = window.ui?.patterns || {};
    const enabledPatterns = this.settings.patterns.enabled;
    const customPatterns = this.settings.patterns.custom;
    
    const filtered = {};
    
    // Filter built-in patterns
    Object.entries(allPatterns).forEach(([category, patterns]) => {
        if (patterns && patterns.length > 0) {
            const enabledInCategory = patterns.filter(pattern => {
                const patternId = pattern.id || pattern.name || pattern;
                // If never set, default to enabled (true). Otherwise use stored value.
                return enabledPatterns.hasOwnProperty(patternId) ? enabledPatterns[patternId] : true;
            });
            if (enabledInCategory.length > 0) {
                filtered[category] = enabledInCategory;
            }
        }
    });
    
    // Add enabled custom patterns
    const enabledCustom = Object.entries(customPatterns)
        .filter(([name, data]) => enabledPatterns.hasOwnProperty(name) ? enabledPatterns[name] : true)
        .map(([name, data]) => ({ name, description: data.description }));
        
    if (enabledCustom.length > 0) {
        filtered.custom = enabledCustom;
    }
    
    return filtered;
};

SettingsManager.prototype.addCustomPattern = async function(name, category, description, content) {
    try {
        // Save to backend first if available
        if (window.api) {
            try {
                const response = await fetch('/api/patterns/custom', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        category,
                        description,
                        content
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Custom pattern saved to backend:', result);
                }
            } catch (error) {
                console.warn('Backend save failed for custom pattern:', error.message);
            }
        }
        
        // Save to local settings
        this.settings.patterns.custom[name] = {
            category,
            description,
            content,
            created: new Date().toISOString()
        };
        
        // Enable by default
        this.settings.patterns.enabled[name] = true;
        
        await this.saveSettings();
        return true;
    } catch (error) {
        console.error('Failed to add custom pattern:', error);
        return false;
    }
};

SettingsManager.prototype.removeCustomPattern = function(name) {
    delete this.settings.patterns.custom[name];
    delete this.settings.patterns.enabled[name];
    this.saveSettings();
    
    // Refresh UI
    this.populatePatternToggles();
    if (window.ui && window.ui.populatePatterns) {
        window.ui.populatePatterns(this.getEnabledPatterns());
    }
};

// Pattern template system
const PATTERN_TEMPLATES = {
    basic: `# IDENTITY and PURPOSE

You are an expert analyst who specializes in analyzing content and providing clear, structured insights.

Take a deep breath and think step-by-step about how to best analyze the given content.

# STEPS

- Read through the content carefully
- Identify key themes and concepts
- Analyze the main points and supporting details
- Consider the context and implications

# OUTPUT SECTIONS

- **Summary** - A brief overview of the content
- **Key Points** - The most important findings or arguments
- **Analysis** - Deeper insights and interpretation
- **Implications** - What this means or suggests

# OUTPUT INSTRUCTIONS

- Use clear, concise language
- Structure your response with the sections above
- Be objective and factual
- Provide specific examples when relevant

# INPUT

INPUT:`,

    writing: `# IDENTITY and PURPOSE

You are an expert writing coach who helps people improve their written communication with clarity, style, and impact.

Take a deep breath and think step-by-step about how to enhance the given text.

# STEPS

- Analyze the current writing for clarity, flow, and style
- Identify areas for improvement
- Consider the intended audience and purpose
- Apply writing best practices

# OUTPUT SECTIONS

- **Improved Version** - The enhanced text
- **Key Changes** - What was modified and why
- **Writing Tips** - Specific advice for better writing
- **Style Notes** - Observations about tone and voice

# OUTPUT INSTRUCTIONS

- Maintain the original meaning and intent
- Improve clarity without losing authenticity
- Use active voice where appropriate
- Ensure smooth transitions between ideas

# INPUT

INPUT:`,

    summarize: `# IDENTITY and PURPOSE

You are a skilled summarizer who creates concise, comprehensive summaries that capture the essential information from any content.

Take a deep breath and think step-by-step about the key elements to include.

# STEPS

- Identify the main topic and purpose
- Extract the most important points
- Note key supporting details
- Consider the overall structure and flow

# OUTPUT SECTIONS

- **Main Summary** - Core content in 2-3 paragraphs
- **Key Points** - Bullet points of essential information
- **Context** - Background or setting information
- **Takeaways** - What readers should remember

# OUTPUT INSTRUCTIONS

- Keep summaries concise but comprehensive
- Use clear, accessible language
- Maintain logical flow
- Focus on what's most important

# INPUT

INPUT:`,

    extract: `# IDENTITY and PURPOSE

You are an information extraction specialist who identifies and extracts specific types of information from content.

Take a deep breath and think step-by-step about what information to extract.

# STEPS

- Scan the content systematically
- Identify relevant information based on the request
- Organize findings into logical categories
- Verify accuracy and completeness

# OUTPUT SECTIONS

- **Extracted Information** - The specific data found
- **Categories** - Information organized by type
- **Sources** - Where information was found in the content
- **Notes** - Additional context or observations

# OUTPUT INSTRUCTIONS

- Be thorough and accurate
- Organize information clearly
- Include specific details and examples
- Note any limitations or gaps

# INPUT

INPUT:`,

    creative: `# IDENTITY and PURPOSE

You are a creative assistant who helps generate original ideas, content, and solutions using imagination and innovative thinking.

Take a deep breath and think step-by-step about creative possibilities.

# STEPS

- Consider the creative challenge or prompt
- Generate multiple creative approaches
- Explore unique angles and perspectives
- Develop ideas with creative flair

# OUTPUT SECTIONS

- **Creative Response** - The main creative output
- **Alternative Ideas** - Additional creative options
- **Creative Process** - How the ideas were developed
- **Inspiration** - Sources or influences for the creativity

# OUTPUT INSTRUCTIONS

- Be original and imaginative
- Take creative risks while staying relevant
- Use vivid, engaging language
- Provide multiple creative options when possible

# INPUT

INPUT:`
};

// Global functions for pattern management
function toggleAllPatterns(enabled) {
    const checkboxes = document.querySelectorAll('#patternToggleList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = enabled;
        const patternName = checkbox.id.replace('pattern_', '');
        settingsManager.togglePattern(patternName, enabled);
    });
}

function showCustomPatternDialog() {
    const modal = document.getElementById('customPatternModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Focus first input
        const nameInput = document.getElementById('customPatternName');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }
    }
}

function closeCustomPatternDialog() {
    const modal = document.getElementById('customPatternModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        document.getElementById('customPatternName').value = '';
        document.getElementById('customPatternCategory').value = 'custom';
        document.getElementById('customPatternDescription').value = '';
        document.getElementById('patternTemplate').value = '';
        document.getElementById('customPatternContent').value = '';
    }
}

function loadPatternTemplate(templateType) {
    const contentArea = document.getElementById('customPatternContent');
    if (contentArea && templateType && PATTERN_TEMPLATES[templateType]) {
        contentArea.value = PATTERN_TEMPLATES[templateType];
        updatePatternPreview();
    }
}

function switchEditorTab(tabType) {
    const editTab = document.getElementById('editTab');
    const previewTab = document.getElementById('previewTab');
    const editButton = document.querySelector('.editor-tab[onclick*="edit"]');
    const previewButton = document.querySelector('.editor-tab[onclick*="preview"]');
    
    if (tabType === 'edit') {
        editTab.style.display = 'block';
        previewTab.style.display = 'none';
        editButton.classList.add('active');
        previewButton.classList.remove('active');
    } else {
        editTab.style.display = 'none';
        previewTab.style.display = 'block';
        editButton.classList.remove('active');
        previewButton.classList.add('active');
        updatePatternPreview();
    }
}

function updatePatternPreview() {
    const content = document.getElementById('customPatternContent').value;
    const preview = document.getElementById('patternPreviewText');
    if (preview) {
        preview.textContent = content || 'No content to preview';
    }
}

function validatePatternName(name) {
    return /^[a-z0-9_]+$/.test(name) && name.length > 0 && name.length <= 50;
}

async function saveCustomPattern() {
    const name = document.getElementById('customPatternName').value.trim();
    const category = document.getElementById('customPatternCategory').value;
    const description = document.getElementById('customPatternDescription').value.trim();
    const content = document.getElementById('customPatternContent').value.trim();
    
    // Validation
    if (!name) {
        showToast('Pattern name is required', 'error');
        return;
    }
    
    if (!validatePatternName(name)) {
        showToast('Pattern name must contain only lowercase letters, numbers, and underscores', 'error');
        return;
    }
    
    if (!description) {
        showToast('Pattern description is required', 'error');
        return;
    }
    
    if (!content) {
        showToast('Pattern content is required', 'error');
        return;
    }
    
    // Check if pattern name already exists
    const allPatterns = window.ui?.patterns || {};
    const customPatterns = settingsManager.settings.patterns.custom;
    
    const nameExists = Object.values(allPatterns).some(patterns => 
        patterns && patterns.some(p => (p.name || p) === name)
    ) || customPatterns[name];
    
    if (nameExists) {
        if (!confirm(`Pattern "${name}" already exists. Overwrite?`)) {
            return;
        }
    }
    
    // Save the pattern
    const success = await settingsManager.addCustomPattern(name, category, description, content);
    if (success) {
        showToast(`Custom pattern "${name}" created successfully`, 'success');
        closeCustomPatternDialog();
        
        // Refresh pattern list in settings
        settingsManager.populatePatternToggles();
        
        // Refresh main pattern dropdown
        if (window.ui && window.ui.populatePatterns) {
            window.ui.populatePatterns(settingsManager.getEnabledPatterns());
        }
    } else {
        showToast('Failed to save custom pattern', 'error');
    }
}

// Auto-update preview when editing
document.addEventListener('input', (e) => {
    if (e.target.id === 'customPatternContent') {
        const previewTab = document.getElementById('previewTab');
        if (previewTab && previewTab.style.display !== 'none') {
            updatePatternPreview();
        }
    }
});

// Export for use by other modules
window.settingsManager = settingsManager;