"""
============================================================================================
  AI PROMPT EVALUATOR & OPTIMIZER — FastAPI Backend
  main.py
============================================================================================
  Endpoints:
    GET  /             → health check
    GET  /report       → full ML report (metrics, graphs, analysis, conclusion)
    POST /evaluate     → predict quality score for a given prompt
    POST /optimize     → rewrite prompt using Groq LLM API
============================================================================================
"""

import os
import json
import time
import re
import logging
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv

# ──────────────────────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

BASE_DIR      = os.path.dirname(__file__)
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODEL_PATH    = os.path.join(ARTIFACTS_DIR, "prompt_quality_model.joblib")
SCALER_PATH   = os.path.join(ARTIFACTS_DIR, "scaler.joblib")
REPORT_PATH   = os.path.join(ARTIFACTS_DIR, "report.json")

EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# ─── Placeholder — replace with your real key or set GROQ_API_KEY env var ────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY")
GROQ_MODEL   = "qwen/qwen3.8-27b"   # Change to preferred Groq model

# ──────────────────────────────────────────────────────────────────────────────
# GLOBAL SINGLETONS — loaded once at startup
# ──────────────────────────────────────────────────────────────────────────────
class ML:
    embed_model: Optional[SentenceTransformer] = None
    sklearn_model  = None
    scaler         = None
    report: Optional[dict] = None

ml = ML()

HAND_FEATURES = [
    "word_count", "char_count", "sentence_count", "avg_word_len",
    "has_role", "has_task_kw", "has_format_kw",
    "has_context_kw", "has_constraint_kw"
]

def extract_hand_features(text: str) -> np.ndarray:
    wc  = len(text.split())
    cc  = len(text)
    sc  = text.count(".") + text.count("!") + text.count("?") + 1
    awl = cc / max(wc, 1)
    has_role    = int(bool(re.search(r"you are|act as|your role",    text, re.I)))
    has_task    = int(bool(re.search(r"task|objective|provide|create|generate", text, re.I)))
    has_format  = int(bool(re.search(r"format|output|markdown|json|summary",    text, re.I)))
    has_ctx     = int(bool(re.search(r"context|background|given|consider",      text, re.I)))
    has_const   = int(bool(re.search(r"constraint|ensure|must|following|using", text, re.I)))
    return np.array([wc, cc, sc, awl, has_role, has_task,
                     has_format, has_ctx, has_const], dtype=float)

# ──────────────────────────────────────────────────────────────────────────────
# LIFESPAN — load heavy models once at startup
# ──────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  Starting AI Prompt Evaluator Backend …")

    # Load embedding model
    logger.info("Loading sentence-transformer …")
    ml.embed_model = SentenceTransformer(EMBED_MODEL_NAME)
    logger.info("✓ Sentence-transformer ready.")

    # Load sklearn model + scaler
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        ml.sklearn_model = joblib.load(MODEL_PATH)
        ml.scaler        = joblib.load(SCALER_PATH)
        logger.info("✓ Scikit-Learn model & scaler loaded.")
    else:
        logger.warning(
            "⚠  Model artifacts not found at %s — run train_pipeline.py first.",
            ARTIFACTS_DIR,
        )

    # Load report
    if os.path.exists(REPORT_PATH):
        with open(REPORT_PATH, "r") as f:
            ml.report = json.load(f)
        logger.info("✓ Report loaded.")
    else:
        logger.warning("⚠  Report not found — run train_pipeline.py first.")

    logger.info("✅  Backend ready.")
    yield

    logger.info("🛑  Shutting down …")

# ──────────────────────────────────────────────────────────────────────────────
# APP
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "AI Prompt Evaluator & Optimizer API",
    description = "FastAPI backend for ML-based prompt quality prediction and LLM-based optimization.",
    version     = "1.0.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ──────────────────────────────────────────────────────────────────────────────
class PromptRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=8000,
                        example="Explain transformer models in simple terms.")

class EvaluateResponse(BaseModel):
    score:            float
    grade:            str
    word_count:       int
    char_count:       int
    sentence_count:   int
    has_role:         bool
    has_task_kw:      bool
    has_format_kw:    bool
    has_context_kw:   bool
    has_constraint_kw:bool
    inference_ms:     float

class OptimizeResponse(BaseModel):
    original_prompt:  str
    optimized_prompt: str
    improvements:     list[str]
    groq_model:       str
    inference_ms:     float

# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────
def score_to_grade(score: float) -> str:
    if score >= 8.5: return "Excellent"
    if score >= 7.0: return "Good"
    if score >= 5.0: return "Fair"
    if score >= 3.0: return "Needs Improvement"
    return "Poor"

def predict_score(text: str) -> tuple[float, np.ndarray]:
    """Returns (score, hand_features_array)."""
    if ml.embed_model is None or ml.sklearn_model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run train_pipeline.py first.",
        )
    embedding  = ml.embed_model.encode([text])[0]
    hand_feats = extract_hand_features(text)
    X = np.hstack([embedding, hand_feats]).reshape(1, -1)
    X_scaled = ml.scaler.transform(X)
    score = float(np.clip(ml.sklearn_model.predict(X_scaled)[0], 0, 10))
    return score, hand_feats

# ──────────────────────────────────────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "AI Prompt Evaluator & Optimizer",
        "model_loaded": ml.sklearn_model is not None,
        "report_loaded": ml.report is not None,
    }


@app.get("/report", tags=["Report"])
async def get_report():
    """Return the full ML training report including metrics, graphs, and conclusion."""
    if ml.report is None:
        raise HTTPException(
            status_code=503,
            detail="Report not available. Run train_pipeline.py first.",
        )
    return JSONResponse(content=ml.report)


@app.post("/evaluate", response_model=EvaluateResponse, tags=["Inference"])
async def evaluate_prompt(body: PromptRequest):
    """
    Accept a prompt string and return the predicted quality score
    along with interpretable feature flags.
    """
    t0 = time.perf_counter()
    try:
        score, hand_feats = predict_score(body.prompt)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Evaluation error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    elapsed = (time.perf_counter() - t0) * 1000

    (wc, cc, sc, awl,
     has_role, has_task, has_fmt, has_ctx, has_const) = hand_feats

    return EvaluateResponse(
        score             = round(score, 3),
        grade             = score_to_grade(score),
        word_count        = int(wc),
        char_count        = int(cc),
        sentence_count    = int(sc),
        has_role          = bool(has_role),
        has_task_kw       = bool(has_task),
        has_format_kw     = bool(has_fmt),
        has_context_kw    = bool(has_ctx),
        has_constraint_kw = bool(has_const),
        inference_ms      = round(elapsed, 2),
    )


@app.post("/optimize", response_model=OptimizeResponse, tags=["Optimization"])
async def optimize_prompt(body: PromptRequest):
    """
    Accept a prompt string and use the Groq API to rewrite it as a
    higher-quality, structured prompt. Returns both the improved prompt
    and a list of specific improvements made.
    """
    if GROQ_API_KEY == "YOUR_GROQ_API_KEY":
        raise HTTPException(
            status_code=503,
            detail=(
                "Groq API key not configured. "
                "Set the GROQ_API_KEY environment variable or edit main.py."
            ),
        )

    t0 = time.perf_counter()

    system_prompt = """You are an expert prompt engineer. Your task is to rewrite user prompts to be significantly higher quality.

A high-quality prompt has:
1. A clear ROLE definition (e.g., "You are a senior data scientist...")
2. Specific CONTEXT or background information
3. A well-defined TASK with actionable verbs
4. An explicit OUTPUT FORMAT specification
5. Relevant CONSTRAINTS (length, tone, audience, format)
6. EXAMPLES when helpful

Rules:
- Preserve the original intent 100%
- Make it 2-4x more specific and structured
- Return a JSON object with exactly two keys:
  "optimized_prompt": the improved prompt (string)
  "improvements": a list of 3-5 short strings describing what was improved
- Return ONLY valid JSON, no markdown fences."""

    user_message = f"""Original prompt: {body.prompt}

Rewrite this as a high-quality, structured prompt and return the result as JSON."""

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model       = GROQ_MODEL,
            messages    = [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature = 0.4,
            max_tokens  = 1500,
        )
        raw = response.choices[0].message.content.strip()

        # Robust JSON extraction — strip any accidental markdown fences
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError(f"No JSON found in Groq response: {raw[:200]}")
        data = json.loads(json_match.group())

        optimized = data.get("optimized_prompt", raw)
        improvements = data.get("improvements", ["Prompt was restructured and enhanced."])
        if isinstance(improvements, str):
            improvements = [improvements]

    except json.JSONDecodeError as exc:
        logger.error("JSON parse error from Groq: %s", exc)
        raise HTTPException(status_code=502, detail=f"Invalid JSON from Groq API: {exc}")
    except Exception as exc:
        logger.exception("Groq API error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Groq API error: {exc}")

    elapsed = (time.perf_counter() - t0) * 1000

    return OptimizeResponse(
        original_prompt  = body.prompt,
        optimized_prompt = optimized,
        improvements     = improvements,
        groq_model       = GROQ_MODEL,
        inference_ms     = round(elapsed, 2),
    )


# ──────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
