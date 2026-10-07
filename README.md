# NLP Text Intelligence Platform

> An advanced NLP web application powered by **Google Gemini 1.5 Flash**, built with Python (Flask) and Vanilla JavaScript.

![NLP Platform Demo](https://img.shields.io/badge/LLM-Gemini%201.5%20Flash-4285F4?style=for-the-badge&logo=google)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ Features

| Tool | Description |
|------|-------------|
| 📋 **Summarization** | Extracts key points & concise summaries with word count stats |
| 😊 **Sentiment Analysis** | 6-emotion breakdown (joy, anger, sadness, fear, surprise, disgust) + phrase highlighting |
| 🔍 **Named Entity Recognition** | Identifies people, organizations, locations, dates, money, products, events, concepts |
| 💡 **Question & Answering** | Answers questions based on provided context with source citations |
| 📂 **Text Classification** | Multi-dimensional classification (domain, type, audience, tone, complexity) |
| 🏷️ **Keyword Extraction** | Top keywords, themes, and SEO tags with relevance scoring |
| 🌐 **Translation** | Translates to 15 languages with cultural context notes |
| ✏️ **Writing Improvement** | Grammar fixes, readability scores, and detailed issue explanations |

---

## 🏗️ Project Architecture

```
NLP-project/
├── app.py              # Flask REST API backend (8 NLP endpoints)
├── prompts.py          # All LLM prompt templates (structured JSON output)
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variable template
├── .gitignore
├── README.md
├── templates/
│   └── index.html      # Single-page application UI
└── static/
    ├── css/style.css   # Dark-mode glassmorphism design system
    └── js/main.js      # Frontend logic & API integration
```

---

## 🤖 LLM Integration

This project uses **Google Gemini 1.5 Flash** via the `google-generativeai` Python SDK.

### Why Gemini 1.5 Flash?
- **Speed**: Ultra-fast inference (2–5 seconds per request)
- **Cost-effective**: Free tier available via Google AI Studio
- **JSON output**: Reliable structured output for programmatic use
- **Context length**: 1M token context window

### How Prompts Are Engineered (`prompts.py`)

Each prompt follows a strict structure:
1. **Role definition** — Establishes the model's persona (e.g., "expert sentiment analyzer")
2. **Input template** — Uses `{text}` placeholders filled at runtime
3. **Output schema** — Explicitly defines the expected JSON structure
4. **Constraints** — "Respond ONLY with valid JSON" prevents markdown wrapping

Example prompt structure:
```python
SENTIMENT_PROMPT = """You are an expert sentiment analysis engine...
Text: \"\"\"{text}\"\"\"
Respond ONLY with valid JSON:
{{ "overall_sentiment": "...", "confidence": 0.95, ... }}"""
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server & API key status |
| POST | `/api/summarize` | Text summarization |
| POST | `/api/sentiment` | Sentiment & emotion analysis |
| POST | `/api/ner` | Named entity recognition |
| POST | `/api/qa` | Question answering (requires `context` + `question`) |
| POST | `/api/classify` | Multi-label text classification |
| POST | `/api/keywords` | Keyword & keyphrase extraction |
| POST | `/api/translate` | Language translation (15 languages) |
| POST | `/api/improve` | Grammar & writing improvement |
| POST | `/api/analyze-all` | Run all analyses in one request |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd NLP-project

# 2. Create a virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Configuration (`.env`)

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=5000
FLASK_DEBUG=false
```

### Run

```bash
python app.py
```

Open your browser at **http://localhost:5000**

---

## 📖 Usage

1. **Enter text** in the main textarea (or click "Load Sample" to use a pre-loaded example)
2. **Click any tool button** to run that specific NLP analysis
3. **View results** instantly in a beautifully formatted panel below
4. For **Q&A**: Enter your question in the question input field that appears

### Request Format (for direct API use)

```bash
# Sentiment Analysis
curl -X POST http://localhost:5000/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I absolutely love this product! It exceeded all my expectations."}'

# Translation
curl -X POST http://localhost:5000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you?", "target_language": "French"}'

# Q&A
curl -X POST http://localhost:5000/api/qa \
  -H "Content-Type: application/json" \
  -d '{"context": "The Eiffel Tower is in Paris...", "question": "Where is the Eiffel Tower?"}'
```

---

## 🎨 Design

- **Dark-mode glassmorphism** UI with animated background orbs
- **Inter** (Google Fonts) typography for modern readability
- Responsive grid layout — works on mobile and desktop
- Smooth animations, hover effects, and loading states
- Color-coded entity types, emotion bars, and category confidence scores

---

## 🧪 Evaluation Criteria

| Criterion | Implementation |
|-----------|----------------|
| **Code Quality** | Modular structure, type hints, error handling, logging |
| **LLM API Usage** | Gemini 1.5 Flash with 8 meaningful NLP endpoints |
| **Prompt Engineering** | Structured JSON prompts with role, schema, and constraints |
| **Project Quality** | Full-stack app with premium UI, RESTful API, documentation |

---

## 📦 Dependencies

```
flask>=3.0.0          # Web framework
flask-cors>=4.0.0     # Cross-Origin Resource Sharing
google-generativeai   # Gemini API SDK
python-dotenv         # Environment variable management
gunicorn              # Production WSGI server
```

---

## 🔒 Security Notes

- Never commit your `.env` file (it's in `.gitignore`)
- The `.env.example` file is safe to commit — it contains no real keys
- API keys are loaded from environment variables only

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ using Google Gemini AI & Flask**
