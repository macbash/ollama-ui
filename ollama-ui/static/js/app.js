// State management
let selectedModel = '';
let conversationHistory = [];
let isStreaming = false;

// DOM elements
const modelSelect = document.getElementById('modelSelect');
const refreshModelsBtn = document.getElementById('refreshModels');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const connectionStatus = document.getElementById('connectionStatus');

// Initialize app
async function init() {
    await checkConnection();
    await loadModels();
    setupEventListeners();
}

// Check Ollama connection
async function checkConnection() {
    try {
        const response = await fetch('/api/test-connection');
        const data = await response.json();

        if (data.status === 'connected') {
            updateConnectionStatus(true);
        } else {
            updateConnectionStatus(false, data.message);
        }
    } catch (error) {
        updateConnectionStatus(false, 'Cannot connect to Ollama. Make sure it\'s running.');
    }
}

// Update connection status UI
function updateConnectionStatus(connected, message = '') {
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('.status-text');

    if (connected) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Connected';
    } else {
        statusDot.className = 'status-dot error';
        statusText.textContent = message || 'Disconnected';
    }
}

// Load available models
async function loadModels() {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();

        if (data.models && data.models.length > 0) {
            populateModelSelect(data.models);
        } else {
            modelSelect.innerHTML = '<option value="">No models available</option>';
        }
    } catch (error) {
        console.error('Error loading models:', error);
        showError('Failed to load models. Please check your Ollama installation.');
    }
}

// Populate model select dropdown
function populateModelSelect(models) {
    modelSelect.innerHTML = '<option value="">Select a model...</option>';

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = `${model.name} (${formatSize(model.size)})`;
        modelSelect.appendChild(option);
    });

    modelSelect.disabled = false;
}

// Format model size
function formatSize(bytes) {
    const gb = bytes / (1024 ** 3);
    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / (1024 ** 2)).toFixed(0)}MB`;
}

// Setup event listeners
function setupEventListeners() {
    modelSelect.addEventListener('change', handleModelChange);
    refreshModelsBtn.addEventListener('click', handleRefreshModels);
    sendButton.addEventListener('click', handleSendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });
}

// Handle model selection
function handleModelChange(e) {
    selectedModel = e.target.value;

    if (selectedModel) {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();

        // Clear welcome message
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg && conversationHistory.length === 0) {
            welcomeMsg.remove();
        }
    } else {
        messageInput.disabled = true;
        sendButton.disabled = true;
    }
}

// Handle refresh models
async function handleRefreshModels() {
    refreshModelsBtn.disabled = true;
    await loadModels();
    setTimeout(() => {
        refreshModelsBtn.disabled = false;
    }, 1000);
}

// Handle send message
async function handleSendMessage() {
    const message = messageInput.value.trim();

    if (!message || !selectedModel || isStreaming) {
        return;
    }

    // Add user message to conversation
    addMessage('user', message);
    conversationHistory.push({ role: 'user', content: message });

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Disable input while streaming
    isStreaming = true;
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Create assistant message element
    const assistantMsgDiv = createMessageElement('assistant', '', true);
    messagesContainer.appendChild(assistantMsgDiv);
    scrollToBottom();

    // Stream response
    await streamResponse(assistantMsgDiv);
}

// Stream response from API
async function streamResponse(messageDiv) {
    const contentDiv = messageDiv.querySelector('.message-content');
    let fullResponse = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: conversationHistory
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.error) {
                            showError(data.error);
                            break;
                        }

                        if (data.content) {
                            fullResponse += data.content;
                            contentDiv.textContent = fullResponse;
                            scrollToBottom();
                        }

                        if (data.done) {
                            contentDiv.classList.remove('streaming');
                            conversationHistory.push({
                                role: 'assistant',
                                content: fullResponse
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error streaming response:', error);
        showError('Failed to get response from model.');
        messageDiv.remove();
    } finally {
        isStreaming = false;
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Add message to UI
function addMessage(role, content) {
    const messageDiv = createMessageElement(role, content);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Create message element
function createMessageElement(role, content, streaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const header = document.createElement('div');
    header.className = 'message-header';

    const roleSpan = document.createElement('span');
    roleSpan.className = 'message-role';
    roleSpan.textContent = role === 'user' ? '👤 You' : '🤖 Assistant';

    header.appendChild(roleSpan);

    const contentDiv = document.createElement('div');
    contentDiv.className = `message-content${streaming ? ' streaming' : ''}`;
    contentDiv.textContent = content;

    messageDiv.appendChild(header);
    messageDiv.appendChild(contentDiv);

    return messageDiv;
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `Error: ${message}`;
    messagesContainer.appendChild(errorDiv);
    scrollToBottom();

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
