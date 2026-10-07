"""
prompts.py - Centralized prompt engineering for NLP Text Intelligence Platform
All prompts are carefully crafted to produce structured, reliable JSON output.
"""

# ─────────────────────────────────────────────
#  SUMMARIZATION PROMPT
# ─────────────────────────────────────────────
SUMMARIZE_PROMPT = """You are an expert text summarizer. Analyze the given text and produce a structured summary.

Text to summarize:
\"\"\"
{text}
\"\"\"

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "summary": "<concise 2-4 sentence summary>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"],
  "word_count_original": <integer>,
  "word_count_summary": <integer>,
  "reading_time_minutes": <float>
}}"""


# ─────────────────────────────────────────────
#  SENTIMENT ANALYSIS PROMPT
# ─────────────────────────────────────────────
SENTIMENT_PROMPT = """You are an expert sentiment analysis engine. Analyze the sentiment of the provided text with nuance and precision.

Text to analyze:
\"\"\"
{text}
\"\"\"

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "overall_sentiment": "<Positive | Negative | Neutral | Mixed>",
  "confidence": <float between 0 and 1>,
  "sentiment_scores": {{
    "positive": <float 0-1>,
    "negative": <float 0-1>,
    "neutral": <float 0-1>
  }},
  "emotions": {{
    "joy": <float 0-1>,
    "anger": <float 0-1>,
    "sadness": <float 0-1>,
    "fear": <float 0-1>,
    "surprise": <float 0-1>,
    "disgust": <float 0-1>
  }},
  "sentiment_explanation": "<brief explanation of why this sentiment was detected>",
  "highlighted_phrases": [
    {{"phrase": "<phrase>", "sentiment": "<Positive|Negative|Neutral>", "intensity": <float 0-1>}}
  ]
}}"""


# ─────────────────────────────────────────────
#  NAMED ENTITY RECOGNITION PROMPT
# ─────────────────────────────────────────────
NER_PROMPT = """You are an expert Named Entity Recognition (NER) system. Extract all meaningful entities from the text.

Text to analyze:
\"\"\"
{text}
\"\"\"

Entity categories:
- PERSON: Real or fictional people
- ORGANIZATION: Companies, agencies, institutions
- LOCATION: Cities, countries, geographic features
- DATE: Dates, times, durations
- MONEY: Monetary values
- PRODUCT: Products, services, technologies
- EVENT: Named events, occasions
- CONCEPT: Abstract concepts, theories, methodologies

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "entities": [
    {{
      "text": "<entity text>",
      "type": "<entity type>",
      "description": "<brief description>",
      "relevance": <float 0-1>
    }}
  ],
  "entity_summary": {{
    "total_count": <integer>,
    "by_type": {{
      "PERSON": <integer>,
      "ORGANIZATION": <integer>,
      "LOCATION": <integer>,
      "DATE": <integer>,
      "MONEY": <integer>,
      "PRODUCT": <integer>,
      "EVENT": <integer>,
      "CONCEPT": <integer>
    }}
  }}
}}"""


# ─────────────────────────────────────────────
#  QUESTION ANSWERING PROMPT
# ─────────────────────────────────────────────
QA_PROMPT = """You are an expert question-answering system. Answer the user's question based strictly on the provided context text.

Context:
\"\"\"
{context}
\"\"\"

Question: {question}

Rules:
- Answer ONLY based on the provided context.
- If the answer is not in the context, say so clearly.
- Provide the answer with confidence and cite relevant parts of the text.

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "answer": "<detailed answer to the question>",
  "confidence": <float 0-1>,
  "is_answerable": <true|false>,
  "relevant_excerpt": "<the most relevant part of the context that supports the answer>",
  "follow_up_questions": ["<suggested follow-up question 1>", "<suggested follow-up question 2>"]
}}"""


# ─────────────────────────────────────────────
#  TEXT CLASSIFICATION PROMPT
# ─────────────────────────────────────────────
CLASSIFY_PROMPT = """You are an expert text classification system. Classify the provided text into one or more relevant categories.

Text to classify:
\"\"\"
{text}
\"\"\"

Perform multi-dimensional classification:
1. Domain (e.g., Technology, Science, Politics, Sports, Entertainment, Business, Health, Education, etc.)
2. Content Type (e.g., News Article, Opinion, Research, Tutorial, Review, Story, Advertisement, etc.)
3. Audience (e.g., General Public, Experts, Children, Students, Professionals, etc.)
4. Tone (e.g., Formal, Informal, Satirical, Persuasive, Informative, Emotional, etc.)
5. Complexity Level (e.g., Beginner, Intermediate, Advanced, Expert)

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "primary_category": "<main domain>",
  "categories": [
    {{"label": "<category>", "confidence": <float 0-1>}}
  ],
  "content_type": "<type>",
  "target_audience": "<audience>",
  "tone": "<tone>",
  "complexity": "<level>",
  "language": "<detected language>",
  "topics": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "classification_reasoning": "<brief explanation>"
}}"""


# ─────────────────────────────────────────────
#  KEYWORD EXTRACTION PROMPT
# ─────────────────────────────────────────────
KEYWORDS_PROMPT = """You are an expert keyword and keyphrase extraction system. Extract the most important keywords and phrases from the text.

Text to analyze:
\"\"\"
{text}
\"\"\"

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "keywords": [
    {{"keyword": "<word or phrase>", "relevance": <float 0-1>, "frequency": <integer>, "is_technical": <boolean>}}
  ],
  "themes": ["<main theme 1>", "<main theme 2>", "<main theme 3>"],
  "seo_tags": ["<seo tag 1>", "<seo tag 2>", "<seo tag 3>", "<seo tag 4>", "<seo tag 5>"]
}}"""


# ─────────────────────────────────────────────
#  TRANSLATION PROMPT
# ─────────────────────────────────────────────
TRANSLATE_PROMPT = """You are an expert multilingual translator. Translate the following text to {target_language}.

Text to translate:
\"\"\"
{text}
\"\"\"

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "original_language": "<detected source language>",
  "target_language": "{target_language}",
  "translated_text": "<the translation>",
  "translation_notes": "<any important notes about nuance, idioms, or cultural context>",
  "alternative_translations": ["<alternative phrasing 1>", "<alternative phrasing 2>"]
}}"""


# ─────────────────────────────────────────────
#  TEXT IMPROVEMENT / GRAMMAR CHECK PROMPT
# ─────────────────────────────────────────────
IMPROVE_PROMPT = """You are an expert writing coach and editor. Analyze and improve the provided text.

Text to improve:
\"\"\"
{text}
\"\"\"

Perform a comprehensive writing analysis:
- Fix grammar, spelling, and punctuation errors
- Improve clarity, flow, and readability
- Suggest vocabulary enhancements
- Check sentence structure

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "improved_text": "<the improved version of the text>",
  "readability_score": <float 0-100>,
  "readability_level": "<Elementary | Middle School | High School | College | Graduate>",
  "issues_found": [
    {{"type": "<Grammar|Spelling|Style|Clarity|Punctuation>", "original": "<original phrase>", "suggestion": "<corrected phrase>", "explanation": "<why this change was made>"}}
  ],
  "overall_assessment": "<brief overall quality assessment>",
  "improvement_percentage": <estimated percentage improvement>
}}"""
