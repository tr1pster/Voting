from flask import Flask, request, jsonify
import os
import hashlib
import json
from functools import lru_cache

app = Flask(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")
ELECTION_RESULT_HASH = os.getenv("ELECTION_RESULT_HASH", "")

@lru_cache(maxsize=None)  # Caching with unlimited size, consider setting a size limit.
def hash_data(data):
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

@app.route('/verify_integrity', methods=['POST'])
def verify_integrity():
    received_data = request.json
    received_data_hash = hash_data(received_data)
    if received_data_hash == ELECTION_RESULT_HASH:
        return jsonify({"message": "Election integrity verified", "status": "success"}), 200
    else:
        return jsonify({"message": "Election integrity compromised", "status": "failure"}), 403

@app.route('/post_election_analytics', methods=['POST'])
def post_election_analytics():
    analytics_data = request.json
    return jsonify({"message": "Post-election analytics processed", "data_received": analytics_data}), 200

if __name__ == '__main__':
    FLASK_RUN_PORT = os.getenv("FLASK_RUN_PORT", 5000)
    app.run(debug=True, port=int(FLASK_RUN_PORT))