/**
 * UNRAVEL Settings Manager
 * API key management and user preferences
 */

class SettingsManager {
    constructor() {
        this.storageKey = 'unravel_settings';
        this.settings = this.loadSettings();
        this.initializeEventListeners();
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

    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : this.getDefaultSettings();
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
            }
        };
    }

    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
            showToast('Failed to save settings to browser storage', 'error');
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

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('settingsModal');
    if (modal && e.target === modal) {
        closeSettings();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('settingsModal');
        if (modal && modal.style.display === 'flex') {
            closeSettings();
        }
    }
});

// Export for use by other modules
window.settingsManager = settingsManager;