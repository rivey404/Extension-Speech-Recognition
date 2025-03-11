import { getRequestHeaders } from '../../../../script.js';
export { WhisperOpenAICompatibleSttProvider };

const DEBUG_PREFIX = '<Speech Recognition module (Whisper OpenAI Compatible)> ';

class WhisperOpenAICompatibleSttProvider {
    settings;

    defaultSettings = {
        language: '',
        endpoint: 'https://api.openai.com/v1/audio/transcriptions',
        apiKey: '',
        model: 'whisper-1',
    };

    get settingsHtml() {
        let html = `
        <span>API Endpoint URL</span>
        <input type="text" id="whisper_openai_compatible_endpoint" class="text_pole" placeholder="https://your-api-endpoint.com/v1/audio/transcriptions">
        <span>API Key (Optional)</span>
        <input type="password" id="whisper_openai_compatible_api_key" class="text_pole" placeholder="Optional API key">
        <span>Model (Optional)</span>
        <input type="text" id="whisper_openai_compatible_model" class="text_pole" placeholder="whisper-1">
        `;
        return html;
    }

    onSettingsChange() {
        this.settings.endpoint = $('#whisper_openai_compatible_endpoint').val();
        this.settings.apiKey = $('#whisper_openai_compatible_api_key').val();
        this.settings.model = $('#whisper_openai_compatible_model').val() || this.defaultSettings.model;
        console.debug(DEBUG_PREFIX + 'Updated settings');
    }

    loadSettings(settings) {
        // Populate Provider UI given input settings
        if (Object.keys(settings).length == 0) {
            console.debug(DEBUG_PREFIX + 'Using default Whisper OpenAI Compatible STT settings');
        }

        // Initialize with default settings first
        this.settings = Object.assign({}, this.defaultSettings);

        // Override with provided settings
        for (const key in settings) {
            if (key in this.settings) {
                this.settings[key] = settings[key];
            } else {
                throw `Invalid setting passed to STT extension: ${key}`;
            }
        }

        $('#speech_recognition_language').val(this.settings.language);
        $('#whisper_openai_compatible_endpoint').val(this.settings.endpoint);
        $('#whisper_openai_compatible_api_key').val(this.settings.apiKey);
        $('#whisper_openai_compatible_model').val(this.settings.model);
        
        console.debug(DEBUG_PREFIX + 'Whisper OpenAI Compatible STT settings loaded');
    }

    async processAudio(audioBlob) {
        if (!this.settings.endpoint) {
            toastr.error('API endpoint URL is required', 'Configuration Error', { timeOut: 10000 });
            throw new Error('API endpoint URL is required');
        }

        const requestData = new FormData();
        requestData.append('file', audioBlob, 'record.wav');

        // Use the model from settings
        requestData.append('model', this.settings.model);

        if (this.settings.language) {
            requestData.append('language', this.settings.language);
        }

        // Prepare headers - either use the custom API key or get the default headers
        let headers = {};
        if (this.settings.apiKey) {
            headers = {
                'Authorization': `Bearer ${this.settings.apiKey}`,
            };
        } else {
            headers = getRequestHeaders();
            delete headers['Content-Type']; // Let fetch set this for FormData
        }

        try {
            const response = await fetch(this.settings.endpoint, {
                method: 'POST',
                headers: headers,
                body: requestData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                toastr.error(`${response.status}: ${errorText}`, 'STT Generation Failed (Whisper OpenAI Compatible)', { timeOut: 10000 });
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            return result.text;
        } catch (error) {
            toastr.error(`${error.message}`, 'STT Generation Failed (Whisper OpenAI Compatible)', { timeOut: 10000 });
            throw error;
        }
    }
}
