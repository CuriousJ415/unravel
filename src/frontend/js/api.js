/**
 * UNRAVEL API Client
 * Clean HTTP client for backend communication
 */

class UnravelAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error(`JSON Parse Error [${endpoint}]:`, parseError);
                throw new Error(`Invalid response format: ${response.status} ${response.statusText}`);
            }

            if (!response.ok) {
                const errorMsg = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
                console.error(`API Error [${endpoint}]:`, {
                    status: response.status,
                    statusText: response.statusText,
                    data: data,
                    url: url,
                    config: config
                });
                throw new Error(errorMsg);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Health and status
    async getStatus() {
        return this.request('/status');
    }

    // Patterns
    async getPatterns() {
        return this.request('/patterns');
    }

    async getPattern(name) {
        return this.request(`/patterns/${encodeURIComponent(name)}`);
    }

    // AI Providers
    async getProviders() {
        return this.request('/providers');
    }

    async configureProviders(apiKeys) {
        return this.request('/providers/configure', {
            method: 'POST',
            body: JSON.stringify({ apiKeys })
        });
    }

    // Processing
    async processText(data) {
        return this.request('/process', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async processFile(file, data) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add other fields
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        return this.request('/process-file', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
    }

    async processURL(data) {
        return this.request('/process-url', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async processYouTube(data) {
        return this.request('/process-youtube', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// Global API instance
const api = new UnravelAPI();