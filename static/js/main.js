/**
 * main.js — NLP Intelligence Platform Frontend
 * Handles API calls, UI rendering, and interactive states.
 */

"use strict";

// ── Constants ────────────────────────────────────────────────────────────────
const SAMPLE_TEXT = `Artificial intelligence is transforming industries at an unprecedented pace. 
Google DeepMind recently published groundbreaking research on protein folding that could 
revolutionize drug discovery and treat diseases like Alzheimer's and cancer. Meanwhile, 
OpenAI reported revenues exceeding $3.4 billion in 2024, reflecting massive investor confidence. 
The United Nations held its first AI Safety Summit in London, gathering world leaders to discuss 
the ethical implications of rapidly advancing machine learning systems. 
Critics argue that the technology is moving too fast for regulation to keep up, 
while proponents believe AI represents humanity's greatest opportunity to solve 
pressing global challenges like climate change and healthcare access.
Sam Altman stated: "We are building one of the most transformative technologies in human history."`;

const EMOTION_EMOJIS = {
  joy: "😊", anger: "😠", sadness: "😢", fear: "😨", surprise: "😲", disgust: "🤢"
};

const EMOTION_COLORS = {
  joy:      "#f59e0b",
  anger:    "#ef4444",
  sadness:  "#60a5fa",
  fear:     "#a78bfa",
  surprise: "#34d399",
  disgust:  "#f97316"
};

// ── DOM Elements ─────────────────────────────────────────────────────────────
const mainText        = document.getElementById("mainText");
const charCount       = document.getElementById("charCount");
const clearBtn        = document.getElementById("clearBtn");
const sampleBtn       = document.getElementById("sampleBtn");
const loadingOverlay  = document.getElementById("loadingOverlay");
const loadingText     = document.getElementById("loadingText");
const resultsSection  = document.getElementById("resultsSection");
const resultsContent  = document.getElementById("resultsContent");
const resultsMeta     = document.getElementById("resultsMeta");
const closeResults    = document.getElementById("closeResults");
const statusDot       = document.getElementById("statusDot");
const statusLabel     = document.getElementById("statusLabel");
const qaInputContainer = document.getElementById("qaInputContainer");
const questionInput   = document.getElementById("questionInput");
const langSelect      = document.getElementById("langSelect");

// ── Char Counter ─────────────────────────────────────────────────────────────
mainText.addEventListener("input", () => {
  const len = mainText.value.length;
  charCount.textContent = `${len.toLocaleString()} / 15,000`;
  charCount.style.color = len > 12000 ? "var(--red)" : len > 8000 ? "var(--amber)" : "";
});

// ── Clear & Sample ───────────────────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  mainText.value = "";
  mainText.dispatchEvent(new Event("input"));
  hideResults();
});

sampleBtn.addEventListener("click", () => {
  mainText.value = SAMPLE_TEXT;
  mainText.dispatchEvent(new Event("input"));
  mainText.focus();
});

closeResults.addEventListener("click", hideResults);

function hideResults() {
  resultsSection.style.display = "none";
  resultsContent.innerHTML = "";
}

// ── API Health Check ─────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.api_configured) {
      statusDot.className = "status-dot online";
      statusLabel.textContent = `Online · ${data.model}`;
    } else {
      statusDot.className = "status-dot offline";
      statusLabel.textContent = "API key missing";
    }
  } catch {
    statusDot.className = "status-dot offline";
    statusLabel.textContent = "Server offline";
  }
}
checkHealth();

// ── Tool Buttons ─────────────────────────────────────────────────────────────
const toolButtons = document.querySelectorAll(".tool-btn");

// Show Q&A input when Q&A button area is hovered / its button clicked
document.getElementById("btnQa").addEventListener("mouseenter", () => {
  qaInputContainer.style.display = "block";
  qaInputContainer.setAttribute("aria-hidden", "false");
});

toolButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const endpoint = btn.dataset.endpoint;
    const text = mainText.value.trim();

    if (!text) {
      showError("Please enter some text before running analysis.");
      return;
    }

    // Build request body
    const body = { text };

    if (endpoint === "/api/qa") {
      const question = questionInput.value.trim();
      if (!question) {
        qaInputContainer.style.display = "block";
        qaInputContainer.setAttribute("aria-hidden", "false");
        questionInput.focus();
        showError("Please enter a question for Q&A analysis.");
        return;
      }
      body.context = text;
      body.question = question;
      delete body.text;
    }

    if (endpoint === "/api/translate") {
      body.target_language = langSelect.value;
    }

    const taskName = btn.closest(".tool-card").querySelector(".tool-title").textContent;
    await runAnalysis(endpoint, body, taskName);
  });
});

// ── Core API Call ─────────────────────────────────────────────────────────────
async function runAnalysis(endpoint, body, taskName) {
  setLoading(true, `Running ${taskName} with Gemini AI…`);
  hideResults();

  try {
    const startTime = Date.now();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    setLoading(false);

    if (!data.success) {
      showError(data.error || "An unexpected error occurred.");
      return;
    }

    // Show results
    const meta = data.data._meta;
    resultsMeta.innerHTML = `
      <span>Model: ${meta?.model || "gemini-1.5-flash"}</span>
      <span>Latency: ${meta?.latency_seconds ?? elapsed}s</span>
      <span>Task: ${taskName}</span>
    `;

    const html = renderResult(endpoint, data.data);
    resultsContent.innerHTML = html;
    resultsSection.style.display = "block";
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

    // Animate bars after render
    requestAnimationFrame(() => animateBars());

  } catch (err) {
    setLoading(false);
    showError("Network error: Could not reach the server. Is Flask running?");
    console.error(err);
  }
}

// ── Loading State ─────────────────────────────────────────────────────────────
function setLoading(show, msg = "Analyzing…") {
  loadingOverlay.style.display = show ? "flex" : "none";
  loadingOverlay.setAttribute("aria-hidden", show ? "false" : "true");
  loadingText.textContent = msg;
  toolButtons.forEach(b => b.disabled = show);
}

// ── Error Display ─────────────────────────────────────────────────────────────
function showError(msg) {
  resultsMeta.innerHTML = "";
  resultsContent.innerHTML = `
    <div class="result-card glass error-card">
      <div class="error-icon">⚠️</div>
      <div class="error-msg">${escHtml(msg)}</div>
    </div>`;
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Bar Animations ────────────────────────────────────────────────────────────
function animateBars() {
  document.querySelectorAll("[data-width]").forEach(el => {
    el.style.width = el.dataset.width;
  });
}

// ── HTML Escape ───────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pct(val) { return `${Math.round((val || 0) * 100)}%`; }

// ── Result Renderer ───────────────────────────────────────────────────────────
function renderResult(endpoint, data) {
  const map = {
    "/api/summarize":  renderSummary,
    "/api/sentiment":  renderSentiment,
    "/api/ner":        renderNer,
    "/api/qa":         renderQa,
    "/api/classify":   renderClassify,
    "/api/keywords":   renderKeywords,
    "/api/translate":  renderTranslation,
    "/api/improve":    renderImprove,
  };
  const fn = map[endpoint];
  return fn ? fn(data) : `<pre class="result-card glass">${escHtml(JSON.stringify(data, null, 2))}</pre>`;
}

// ─────────────────────────────────────────────
//  SUMMARY
// ─────────────────────────────────────────────
function renderSummary(d) {
  const points = (d.key_points || []).map(p => `<li>${escHtml(p)}</li>`).join("");
  return `
    <div class="result-card glass">
      <h3>📋 Summary</h3>
      <p class="summary-text">${escHtml(d.summary || "")}</p>
      <h3 style="margin-bottom:12px">Key Points</h3>
      <ul class="key-points">${points}</ul>
      <div class="stats-row">
        <div class="stat-chip"><strong>${d.word_count_original || "—"}</strong> original words</div>
        <div class="stat-chip"><strong>${d.word_count_summary || "—"}</strong> summary words</div>
        <div class="stat-chip"><strong>${d.reading_time_minutes || "—"} min</strong> read time</div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
//  SENTIMENT
// ─────────────────────────────────────────────
function renderSentiment(d) {
  const sent = d.overall_sentiment || "Neutral";
  const badgeClass = `badge-${sent.toLowerCase()}`;
  const scores = d.sentiment_scores || {};
  const emotions = d.emotions || {};
  const phrases = d.highlighted_phrases || [];

  const scoresBars = ["positive", "negative", "neutral"].map(k => `
    <div class="score-item">
      <div class="score-label">${k}</div>
      <div class="score-bar-wrap">
        <div class="score-bar" data-width="${pct(scores[k])}" style="width:0%;background:${
          k==="positive"?"var(--green)":k==="negative"?"var(--red)":"var(--text-3)"
        }"></div>
      </div>
      <div class="score-val">${pct(scores[k])}</div>
    </div>`).join("");

  const emotionBars = Object.entries(emotions).map(([k, v]) => `
    <div class="emotion-item">
      <span class="emotion-emoji">${EMOTION_EMOJIS[k] || "🔵"}</span>
      <span class="emotion-name">${k}</span>
      <div class="emotion-bar-wrap">
        <div class="emotion-bar" data-width="${pct(v)}" style="width:0%;background:${EMOTION_COLORS[k]||"var(--purple)"}"></div>
      </div>
      <span class="cat-pct">${pct(v)}</span>
    </div>`).join("");

  const phraseTags = phrases.map(p => {
    const cls = p.sentiment === "Positive" ? "phrase-pos" : p.sentiment === "Negative" ? "phrase-neg" : "phrase-neu";
    return `<span class="phrase-tag ${cls}">${escHtml(p.phrase)}</span>`;
  }).join("");

  return `
    <div class="result-card glass">
      <h3>😊 Sentiment Analysis</h3>
      <div class="sentiment-overview">
        <span class="sentiment-badge ${badgeClass}">${escHtml(sent)}</span>
        <span class="confidence-tag">Confidence: <strong>${pct(d.confidence)}</strong></span>
      </div>
      <h3 style="margin-bottom:12px">Sentiment Scores</h3>
      <div class="scores-grid">${scoresBars}</div>
      <h3 style="margin-bottom:12px">Emotion Breakdown</h3>
      <div class="emotion-grid">${emotionBars}</div>
      ${d.sentiment_explanation ? `<p style="font-size:.88rem;color:var(--text-2);margin-bottom:16px;line-height:1.6">${escHtml(d.sentiment_explanation)}</p>` : ""}
      ${phraseTags ? `<h3 style="margin-bottom:10px">Highlighted Phrases</h3><div class="phrase-list">${phraseTags}</div>` : ""}
    </div>`;
}

// ─────────────────────────────────────────────
//  NER
// ─────────────────────────────────────────────
function renderNer(d) {
  const entities = d.entities || [];
  const summary = d.entity_summary?.by_type || {};

  const chips = Object.entries(summary)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<div class="etype-chip">${k}<span class="count">${v}</span></div>`)
    .join("");

  const list = entities.map(e => `
    <div class="entity-item">
      <span class="entity-type type-${e.type || "CONCEPT"}">${escHtml(e.type || "?")}</span>
      <div>
        <div class="entity-text">${escHtml(e.text || "")}</div>
        <div class="entity-desc">${escHtml(e.description || "")}</div>
        <div class="entity-rel">Relevance: ${pct(e.relevance)}</div>
      </div>
    </div>`).join("");

  return `
    <div class="result-card glass">
      <h3>🔍 Named Entity Recognition</h3>
      <div class="entity-summary">${chips}</div>
      <div class="entities-list">${list || "<p style='color:var(--text-3)'>No entities found.</p>"}</div>
    </div>`;
}

// ─────────────────────────────────────────────
//  Q&A
// ─────────────────────────────────────────────
function renderQa(d) {
  const followUps = (d.follow_up_questions || [])
    .map(q => `<div class="follow-up-item">${escHtml(q)}</div>`).join("");

  const notAnswerable = d.is_answerable === false
    ? `<p style="color:var(--amber);font-size:.85rem;margin-bottom:12px">⚠️ The answer could not be found in the provided text.</p>`
    : "";

  return `
    <div class="result-card glass">
      <h3>💡 Question &amp; Answer</h3>
      ${notAnswerable}
      <div class="answer-block">
        <p class="answer-text">${escHtml(d.answer || "")}</p>
        ${d.relevant_excerpt ? `
          <div class="excerpt-block">
            <div class="excerpt-label">📖 Supporting Excerpt</div>
            <div class="excerpt-text">"${escHtml(d.relevant_excerpt)}"</div>
          </div>` : ""}
      </div>
      <div class="stats-row" style="margin-bottom:20px">
        <div class="stat-chip"><strong>Confidence:</strong> ${pct(d.confidence)}</div>
      </div>
      ${followUps ? `<h3 style="margin-bottom:10px">Follow-up Questions</h3><div class="follow-up-list">${followUps}</div>` : ""}
    </div>`;
}

// ─────────────────────────────────────────────
//  CLASSIFICATION
// ─────────────────────────────────────────────
function renderClassify(d) {
  const cats = (d.categories || []).map(c => `
    <div class="cat-item">
      <span class="cat-name">${escHtml(c.label)}</span>
      <div class="cat-bar-wrap">
        <div class="cat-bar" data-width="${pct(c.confidence)}" style="width:0%"></div>
      </div>
      <span class="cat-pct">${pct(c.confidence)}</span>
    </div>`).join("");

  const topics = (d.topics || []).map(t => `<span class="topic-tag">${escHtml(t)}</span>`).join("");

  return `
    <div class="result-card glass">
      <h3>📂 Text Classification</h3>
      <div class="classify-grid">
        <div class="classify-item"><div class="classify-label">Primary Domain</div><div class="classify-value">${escHtml(d.primary_category||"—")}</div></div>
        <div class="classify-item"><div class="classify-label">Content Type</div><div class="classify-value">${escHtml(d.content_type||"—")}</div></div>
        <div class="classify-item"><div class="classify-label">Audience</div><div class="classify-value">${escHtml(d.target_audience||"—")}</div></div>
        <div class="classify-item"><div class="classify-label">Tone</div><div class="classify-value">${escHtml(d.tone||"—")}</div></div>
        <div class="classify-item"><div class="classify-label">Complexity</div><div class="classify-value">${escHtml(d.complexity||"—")}</div></div>
        <div class="classify-item"><div class="classify-label">Language</div><div class="classify-value">${escHtml(d.language||"—")}</div></div>
      </div>
      ${topics ? `<h3 style="margin-bottom:10px">Topics</h3><div class="topics-row">${topics}</div>` : ""}
      ${cats ? `<h3 style="margin-bottom:12px">Category Scores</h3><div class="cat-list">${cats}</div>` : ""}
      ${d.classification_reasoning ? `<p style="margin-top:16px;font-size:.85rem;color:var(--text-2);line-height:1.6">${escHtml(d.classification_reasoning)}</p>` : ""}
    </div>`;
}

// ─────────────────────────────────────────────
//  KEYWORDS
// ─────────────────────────────────────────────
function renderKeywords(d) {
  const keywords = (d.keywords || []).sort((a, b) => b.relevance - a.relevance);
  const cloud = keywords.map(kw => {
    const size = 0.78 + kw.relevance * 0.44;
    return `<span class="kw-tag ${kw.is_technical ? "technical" : ""}" style="font-size:${size.toFixed(2)}rem">${escHtml(kw.keyword)}</span>`;
  }).join("");

  const themes = (d.themes || []).map(t => `<span class="topic-tag">${escHtml(t)}</span>`).join("");
  const seoTags = (d.seo_tags || []).map(t => `<span class="seo-tag">${escHtml(t)}</span>`).join("");

  return `
    <div class="result-card glass">
      <h3>🏷️ Keyword Extraction</h3>
      ${cloud ? `<div class="keywords-cloud" style="margin-bottom:24px">${cloud}</div>` : ""}
      ${themes ? `<h3 style="margin-bottom:10px">Main Themes</h3><div class="topics-row" style="margin-bottom:20px">${themes}</div>` : ""}
      ${seoTags ? `<h3 style="margin-bottom:10px">SEO Tags</h3><div class="seo-tags">${seoTags}</div>` : ""}
    </div>`;
}

// ─────────────────────────────────────────────
//  TRANSLATION
// ─────────────────────────────────────────────
function renderTranslation(d) {
  const alts = (d.alternative_translations || [])
    .map(a => `<div class="alt-item">${escHtml(a)}</div>`).join("");

  return `
    <div class="result-card glass">
      <h3>🌐 Translation</h3>
      <div class="stats-row" style="margin-bottom:16px">
        <div class="stat-chip"><strong>From:</strong> ${escHtml(d.original_language||"Auto")}</div>
        <div class="stat-chip"><strong>To:</strong> ${escHtml(d.target_language||"—")}</div>
      </div>
      <div class="translation-block">
        <div class="translation-lang">${escHtml(d.target_language||"")} Translation</div>
        <div class="translation-text">${escHtml(d.translated_text||"")}</div>
      </div>
      ${d.translation_notes ? `<div class="translation-note"><strong>📝 Translator's Notes:</strong> ${escHtml(d.translation_notes)}</div>` : ""}
      ${alts ? `<h3 style="margin-bottom:10px">Alternative Phrasings</h3><div class="alt-translations">${alts}</div>` : ""}
    </div>`;
}

// ─────────────────────────────────────────────
//  WRITING IMPROVEMENT
// ─────────────────────────────────────────────
function renderImprove(d) {
  const issues = (d.issues_found || []).map(issue => `
    <div class="issue-item">
      <span class="issue-type issue-${issue.type}">${escHtml(issue.type)}</span>
      <div class="issue-row">
        <span class="issue-original">${escHtml(issue.original || "")}</span>
        <span class="issue-arrow">→</span>
        <span class="issue-fixed">${escHtml(issue.suggestion || "")}</span>
      </div>
      <div class="issue-explanation">${escHtml(issue.explanation || "")}</div>
    </div>`).join("");

  return `
    <div class="result-card glass">
      <h3>✏️ Writing Improvement</h3>
      <div class="readability-row">
        <div class="readability-score">${d.readability_score || "—"}</div>
        <div>
          <div style="font-size:.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Readability Score</div>
          <div class="readability-level">${escHtml(d.readability_level || "")}</div>
          ${d.improvement_percentage ? `<div style="font-size:.78rem;color:var(--green);margin-top:4px">↑ ${d.improvement_percentage}% improvement</div>` : ""}
        </div>
      </div>
      <div class="improved-text-block">
        <div class="improved-label">✅ Improved Version</div>
        <div class="improved-body">${escHtml(d.improved_text || "")}</div>
      </div>
      ${d.overall_assessment ? `<p style="font-size:.88rem;color:var(--text-2);margin-bottom:20px;line-height:1.6">${escHtml(d.overall_assessment)}</p>` : ""}
      ${issues ? `<h3 style="margin-bottom:12px">Issues Found</h3><div class="issues-list">${issues}</div>` : ""}
    </div>`;
}
