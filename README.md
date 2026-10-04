# Ollama Chat UI

A modern, ChatGPT-like web interface for interacting with Ollama models locally.

## Features

- 🎨 Clean, dark-themed interface
- 🔄 Dynamic model selection from your Ollama installation
- 💬 Real-time streaming responses
- 📝 Conversation history maintained during session
- 🔌 Connection status indicator
- ⌨️ Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## Prerequisites

1. **Ollama** must be installed and running on your system
   - Install from: https://ollama.ai
   - Make sure it's running on `localhost:11434` (default)
   - Pull at least one model: `ollama pull llama2` (or any other model)

2. **Python 3.8+**

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

### Start the Application

1. Make sure Ollama is running:
```bash
ollama serve
```

2. Start the Flask application:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

The app will start in debug mode and be accessible at `http://localhost:5000`

### Stop the Application

To stop the Flask application:
- Press `Ctrl+C` in the terminal where the app is running

To stop Ollama (if you started it manually):
- Press `Ctrl+C` in the terminal where Ollama is running
- Or use: `pkill ollama`

## Usage

1. **Connect**: The app will automatically check the connection to Ollama when loaded
2. **Select Model**: Choose from the available models in the dropdown
3. **Chat**: Type your message and press Enter (or click Send)
4. **Stream**: Watch responses stream in real-time, just like ChatGPT

## Project Structure

```
ollama-ui/
├── app.py                 # Flask backend with API endpoints
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       └── app.js        # Frontend JavaScript
└── README.md             # This file
```

## API Endpoints

- `GET /` - Main application page
- `GET /api/models` - Fetch available Ollama models
- `POST /api/chat` - Stream chat responses (Server-Sent Events)
- `GET /api/test-connection` - Test Ollama connection status

## Troubleshooting

**Cannot connect to Ollama:**
- Ensure Ollama is running: `ollama serve`
- Check if Ollama is accessible: `curl http://localhost:11434/api/tags`

**No models available:**
- Pull a model first: `ollama pull llama2`
- Refresh the models list using the refresh button

**Slow responses:**
- This is normal for larger models on CPU
- Consider using smaller models or GPU acceleration

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: Ollama REST API with Server-Sent Events (SSE)

## License

MIT
