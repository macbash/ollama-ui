from flask import Flask, render_template, request, jsonify, Response
import requests
import json

app = Flask(__name__)

# Ollama API endpoint
OLLAMA_BASE_URL = "http://localhost:11434"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/models', methods=['GET'])
def get_models():
    """Fetch available models from Ollama"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            models = response.json().get('models', [])
            return jsonify({'models': models})
        else:
            return jsonify({'error': 'Failed to fetch models'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Stream chat responses from Ollama"""
    data = request.json
    model = data.get('model')
    messages = data.get('messages', [])

    if not model or not messages:
        return jsonify({'error': 'Model and messages are required'}), 400

    def generate():
        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    'model': model,
                    'messages': messages,
                    'stream': True
                },
                stream=True
            )

            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if 'message' in chunk:
                            content = chunk['message'].get('content', '')
                            if content:
                                yield f"data: {json.dumps({'content': content})}\n\n"

                        if chunk.get('done', False):
                            yield f"data: {json.dumps({'done': True})}\n\n"
                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    """Test connection to Ollama"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            return jsonify({'status': 'connected'})
        else:
            return jsonify({'status': 'error', 'message': 'Unable to connect'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
