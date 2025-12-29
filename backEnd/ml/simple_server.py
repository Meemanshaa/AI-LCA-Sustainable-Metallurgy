from flask import Flask, request, jsonify
import json
import subprocess
import sys

app = Flask(__name__)

@app.route('/api/smart-fill', methods=['POST'])
def smart_fill():
    try:
        input_data = request.json
        
        # Call AI prediction service
        result = subprocess.run([
            sys.executable, 'ai_prediction_service.py', 
            json.dumps(input_data)
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            return jsonify(json.loads(result.stdout))
        else:
            return jsonify({
                'success': False,
                'error': 'AI service failed: ' + result.stderr
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'AI ML Service'})

if __name__ == '__main__':
    print("Starting AI ML Service on port 8000...")
    app.run(host='0.0.0.0', port=8000, debug=True)