/**
 * UNRAVEL AI Providers
 * Clean, direct API implementations for multiple AI services
 */

const axios = require('axios');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class OllamaProvider {
    constructor(baseURL = 'http://192.168.4.61:11434') {
        this.baseURL = baseURL;
        this.name = 'Ollama';
        this.type = 'local';
    }

    async getModels() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`);
            return response.data.models.map(model => ({
                id: model.name,
                name: model.name,
                size: model.size
            }));
        } catch (error) {
            console.error('Ollama models error:', error.message);
            return [];
        }
    }

    async generate(prompt, model = 'llama3:8b', options = {}) {
        try {
            const response = await axios.post(`${this.baseURL}/api/generate`, {
                model,
                prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    num_predict: options.max_tokens || 2048
                }
            });

            return {
                content: response.data.response,
                usage: {
                    prompt_tokens: response.data.prompt_eval_count || 0,
                    completion_tokens: response.data.eval_count || 0,
                    total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
                }
            };
        } catch (error) {
            throw new Error(`Ollama generation failed: ${error.message}`);
        }
    }
}

class OpenAIProvider {
    constructor(apiKey) {
        this.client = new OpenAI({ apiKey });
        this.name = 'OpenAI';
        this.type = 'online';
    }

    async getModels() {
        try {
            const models = await this.client.models.list();
            return models.data
                .filter(model => model.id.includes('gpt'))
                .map(model => ({
                    id: model.id,
                    name: model.id,
                    context_length: this.getContextLength(model.id)
                }));
        } catch (error) {
            console.error('OpenAI models error:', error.message);
            return [
                { id: 'gpt-4o', name: 'GPT-4o', context_length: 128000 },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context_length: 128000 },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_length: 16384 }
            ];
        }
    }

    getContextLength(modelId) {
        const contextMap = {
            'gpt-4o': 128000,
            'gpt-4o-mini': 128000,
            'gpt-4-turbo': 128000,
            'gpt-4': 8192,
            'gpt-3.5-turbo': 16384
        };
        return contextMap[modelId] || 4096;
    }

    async generate(prompt, model = 'gpt-4o-mini', options = {}) {
        try {
            // Prepare base request parameters
            const requestParams = {
                model,
                messages: [{ role: 'user', content: prompt }]
            };

            // Handle different model parameter requirements
            const newerModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-5-nano', 'gpt-5-mini', 'gpt-5'];
            const restrictedModels = ['gpt-5-nano']; // Models with very strict parameter requirements
            
            const usesMaxCompletionTokens = newerModels.some(modelName => model.includes(modelName));
            const isRestrictedModel = restrictedModels.some(modelName => model.includes(modelName));
            
            // Add token limit parameter
            if (usesMaxCompletionTokens) {
                requestParams.max_completion_tokens = options.max_tokens || 2048;
            } else {
                requestParams.max_tokens = options.max_tokens || 2048;
            }

            // Only add optional parameters for models that support them
            if (!isRestrictedModel) {
                requestParams.temperature = options.temperature || 0.7;
                requestParams.top_p = options.top_p || 0.9;
            }
            // For restricted models like gpt-5-nano, use only default values (no temperature/top_p)

            const response = await this.client.chat.completions.create(requestParams);

            return {
                content: response.choices[0].message.content,
                usage: response.usage
            };
        } catch (error) {
            throw new Error(`OpenAI generation failed: ${error.message}`);
        }
    }
}

class AnthropicProvider {
    constructor(apiKey) {
        this.client = new Anthropic({ apiKey });
        this.name = 'Anthropic';
        this.type = 'online';
    }

    async getModels() {
        // Anthropic doesn't have a models endpoint, return known models
        return [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', context_length: 200000 },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', context_length: 200000 },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', context_length: 200000 }
        ];
    }

    async generate(prompt, model = 'claude-3-5-sonnet-20241022', options = {}) {
        try {
            const response = await this.client.messages.create({
                model,
                max_tokens: options.max_tokens || 2048,
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
                messages: [{ role: 'user', content: prompt }]
            });

            return {
                content: response.content[0].text,
                usage: response.usage
            };
        } catch (error) {
            throw new Error(`Anthropic generation failed: ${error.message}`);
        }
    }
}

class OpenRouterProvider {
    constructor(apiKey) {
        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://unravel.nauhauslab.com',
                'X-Title': 'Unravel'
            }
        });
        this.name = 'OpenRouter';
        this.type = 'online';
    }

    async getModels() {
        try {
            const response = await axios.get('https://openrouter.ai/api/v1/models', {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return response.data.data.map(model => ({
                id: model.id,
                name: model.id,
                context_length: model.context_length || 4096
            }));
        } catch (error) {
            console.error('OpenRouter models error:', error.message);
            return [
                { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', context_length: 200000 },
                { id: 'openai/gpt-4o', name: 'GPT-4o', context_length: 128000 },
                { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', context_length: 131072 }
            ];
        }
    }

    async generate(prompt, model, options = {}) {
        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
                max_tokens: options.max_tokens || 2048
            });

            return {
                content: response.choices[0].message.content,
                usage: response.usage
            };
        } catch (error) {
            throw new Error(`OpenRouter generation failed: ${error.message}`);
        }
    }
}

class GrokProvider {
    constructor(apiKey) {
        this.client = new OpenAI({
            baseURL: 'https://api.x.ai/v1',
            apiKey,
        });
        this.name = 'Grok';
        this.type = 'online';
    }

    async getModels() {
        try {
            const models = await this.client.models.list();
            return models.data.map(model => ({
                id: model.id,
                name: model.id,
                context_length: this.getContextLength(model.id)
            }));
        } catch (error) {
            console.error('Grok models error:', error.message);
            return [
                { id: 'grok-beta', name: 'Grok Beta', context_length: 131072 },
                { id: 'grok-vision-beta', name: 'Grok Vision Beta', context_length: 8192 }
            ];
        }
    }

    getContextLength(modelId) {
        const contextMap = {
            'grok-beta': 131072,
            'grok-vision-beta': 8192
        };
        return contextMap[modelId] || 8192;
    }

    async generate(prompt, model = 'grok-beta', options = {}) {
        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
                max_tokens: options.max_tokens || 2048
            });

            return {
                content: response.choices[0].message.content,
                usage: response.usage
            };
        } catch (error) {
            throw new Error(`Grok generation failed: ${error.message}`);
        }
    }
}

module.exports = {
    OllamaProvider,
    OpenAIProvider,
    AnthropicProvider,
    OpenRouterProvider,
    GrokProvider
};