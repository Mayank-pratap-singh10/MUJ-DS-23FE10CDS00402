"""
app.py - Flask backend for NLP Text Intelligence Platform
Integrates Google Gemini 1.5 Flash LLM for multiple NLP tasks.
"""

import os
import json
import time
import logging
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from google import genai
from google.genai import types
from dotenv import load_dotenv
from prompts import (
    SUMMARIZE_PROMPT,
    SENTIMENT_PROMPT,
    NER_PROMPT,
    QA_PROMPT,
    CLASSIFY_PROMPT,
    KEYWORDS_PROMPT,
    TRANSLATE_PROMPT,
    IMPROVE_PROMPT,
)

# ── Setup ──────────────────────────────────────────────────────────────────────
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ── Gemini Configuration ───────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set. Set it in .env file.")

# Use Gemini 2.0 Flash for fast, efficient responses
MODEL_NAME = "gemini-2.0-flash"

# Lazy client — initialized on first API call to allow startup without a key
_client = None

def get_client():
    """Return (or create) the Gemini client, raising clearly if key is missing."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set. Add it to your .env file.")
        _client = genai.Client(api_key=api_key)
    return _client

GEN_CONFIG = types.GenerateContentConfig(
    temperature=0.2,        # Low temperature for structured/factual tasks
    top_p=0.8,
    top_k=40,
    max_output_tokens=4096,
)


# ── Helper: Call Gemini and parse JSON ────────────────────────────────────────
def call_gemini(prompt: str) -> dict:
    """
    Send a prompt to Gemini and parse the JSON response.
    Returns a dict with 'data' on success or 'error' on failure.
    """
    raw_text = ""
    try:
        start = time.time()
        response = get_client().models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=GEN_CONFIG,
        )
        elapsed = round(time.time() - start, 3)

        raw_text = response.text.strip()

        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        parsed = json.loads(raw_text)
        parsed["_meta"] = {
            "model": MODEL_NAME,
            "latency_seconds": elapsed,
        }
        return {"success": True, "data": parsed}

    except json.JSONDecodeError as e:
        logger.error("JSON parse error: %s | Raw: %s", e, raw_text[:500])
        return {"success": False, "error": "Model returned invalid JSON. Please try again."}
    except Exception as e:
        logger.error("Gemini API error: %s", e)
        error_msg = str(e)
        if "API_KEY_INVALID" in error_msg or "API key not valid" in error_msg:
            return {"success": False, "error": "Invalid API key. Please check your GEMINI_API_KEY."}
        if "quota" in error_msg.lower():
            return {"success": False, "error": "API quota exceeded. Please wait and try again."}
        return {"success": False, "error": f"API error: {error_msg}"}


def validate_text(text: str, min_len: int = 10, max_len: int = 15000) -> str | None:
    """Return an error message if text is invalid, else None."""
    if not text or not text.strip():
        return "Text cannot be empty."
    if len(text.strip()) < min_len:
        return f"Text must be at least {min_len} characters long."
    if len(text) > max_len:
        return f"Text must not exceed {max_len} characters."
    return None


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    api_configured = bool(os.getenv("GEMINI_API_KEY", ""))
    return jsonify({
        "status": "ok",
        "model": MODEL_NAME,
        "api_configured": api_configured,
    })


@app.route("/api/summarize", methods=["POST"])
def summarize():
    """Summarize provided text."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    err = validate_text(text, min_len=50)
    if err:
        return jsonify({"success": False, "error": err}), 400

    prompt = SUMMARIZE_PROMPT.format(text=text)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/sentiment", methods=["POST"])
def sentiment():
    """Perform sentiment analysis on text."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    err = validate_text(text, min_len=10)
    if err:
        return jsonify({"success": False, "error": err}), 400

    prompt = SENTIMENT_PROMPT.format(text=text)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/ner", methods=["POST"])
def named_entity_recognition():
    """Extract named entities from text."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    err = validate_text(text, min_len=20)
    if err:
        return jsonify({"success": False, "error": err}), 400

    prompt = NER_PROMPT.format(text=text)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/qa", methods=["POST"])
def question_answering():
    """Answer a question based on provided context."""
    data = request.get_json(silent=True) or {}
    context = data.get("context", "")
    question = data.get("question", "")

    err = validate_text(context, min_len=30)
    if err:
        return jsonify({"success": False, "error": f"Context: {err}"}), 400
    if not question or len(question.strip()) < 5:
        return jsonify({"success": False, "error": "Question must be at least 5 characters."}), 400

    prompt = QA_PROMPT.format(context=context, question=question)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/classify", methods=["POST"])
def classify():
    """Classify text into categories."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    err = validate_text(text, min_len=30)
    if err:
        return jsonify({"success": False, "error": err}), 400

    prompt = CLASSIFY_PROMPT.format(text=text)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/keywords", methods=["POST"])
def keywords():
    """Extract keywords and key phrases from text."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    err = validate_text(text, min_len=30)
    if err:
        return jsonify({"success": False, "error": err}), 400

    prompt = KEYWORDS_PROMPT.format(text=text)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/translate", methods=["POST"])
def translate():
    """Translate text to a target language."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    target_language = data.get("target_language", "Spanish")

    err = validate_text(text, min_len=5)
    if err:
        return jsonify({"success": False, "error": err}), 400

    supported_languages = [
        "Spanish", "French", "German", "Italian", "Portuguese",
        "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
        "Russian", "Dutch", "Swedish", "Polish", "Turkish",
    ]
    if target_language not in supported_languages:
        return jsonify({
            "success": False,
            "error": f"Unsupported language. Choose from: {', '.join(supported_languages)}"
        }), 400

    prompt = TRANSLATE_PROMPT.format(text=text, target_language=target_language)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/improve", methods=["POST"])
def improve():
    """Improve grammar, style and clarity of text."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    err = validate_text(text, min_len=20)
    if err:
        return jsonify({"success": False, "error": err}), 400

    prompt = IMPROVE_PROMPT.format(text=text)
    result = call_gemini(prompt)
    return jsonify(result), (200 if result["success"] else 500)


@app.route("/api/analyze-all", methods=["POST"])
def analyze_all():
    """
    Run sentiment, NER, classification and keywords in parallel
    for a comprehensive one-shot analysis.
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    err = validate_text(text, min_len=30)
    if err:
        return jsonify({"success": False, "error": err}), 400

    results = {}
    tasks = {
        "sentiment": SENTIMENT_PROMPT.format(text=text),
        "entities": NER_PROMPT.format(text=text),
        "classification": CLASSIFY_PROMPT.format(text=text),
        "keywords": KEYWORDS_PROMPT.format(text=text),
        "summary": SUMMARIZE_PROMPT.format(text=text),
    }

    for task_name, prompt in tasks.items():
        result = call_gemini(prompt)
        if result["success"]:
            results[task_name] = result["data"]
        else:
            results[task_name] = {"error": result.get("error", "Failed")}

    return jsonify({"success": True, "data": results}), 200


# ── Error Handlers ─────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Endpoint not found."}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"success": False, "error": "Method not allowed."}), 405


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error."}), 500


# ── Entry Point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting NLP Intelligence Platform on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
