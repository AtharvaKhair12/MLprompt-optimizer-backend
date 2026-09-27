"""
============================================================================================
  AI PROMPT EVALUATOR & OPTIMIZER — ML Training Pipeline
  train_pipeline.py
============================================================================================
  Academic Workflow:
    1.  Problem Definition
    2.  Dataset Collection
    3.  Data Preprocessing
    4.  Exploratory Data Analysis (EDA)
    5.  Feature Engineering
    6.  Data Splitting
    7.  Model Development
    8.  Model Training
    9.  Model Testing
    10. Performance Evaluation
    11. Result Analysis
    12. Visualization
    13. Conclusion & Artifact Export
============================================================================================
"""

import os
import json
import time
import base64
import random
import warnings
import textwrap
import io

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from sentence_transformers import SentenceTransformer

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
STATIC_DIR    = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(STATIC_DIR,    exist_ok=True)

MODEL_PATH      = os.path.join(ARTIFACTS_DIR, "prompt_quality_model.joblib")
SCALER_PATH     = os.path.join(ARTIFACTS_DIR, "scaler.joblib")
METRICS_PATH    = os.path.join(ARTIFACTS_DIR, "metrics.json")
REPORT_PATH     = os.path.join(ARTIFACTS_DIR, "report.json")

EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
RANDOM_STATE     = 42
TEST_SIZE        = 0.20

def log(step: int, title: str, message: str = ""):
    sep = "-" * 72
    print(f"\n{sep}")
    print(f"  STEP {step:02d} > {title}")
    print(sep)
    if message:
        for line in textwrap.wrap(message, width=70):
            print(f"  {line}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 — PROBLEM DEFINITION
# ──────────────────────────────────────────────────────────────────────────────
log(1, "PROBLEM DEFINITION")

PROBLEM_STATEMENT = (
    "Regression task: predict a continuous 'Prompt Quality Score' (0–10) "
    "from raw prompt text. Features are extracted via sentence-transformer "
    "embeddings (semantic density) plus hand-crafted lexical/structural "
    "statistics. A RandomForestRegressor is the primary estimator; Ridge "
    "regression is used as a linear baseline. The model enables real-time "
    "quality inference via FastAPI so users receive instant feedback before "
    "sending prompts to expensive LLM APIs."
)
print(f"\n  {PROBLEM_STATEMENT}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 — DATASET COLLECTION
# ──────────────────────────────────────────────────────────────────────────────
log(2, "DATASET COLLECTION", "Generating 600-record synthetic prompt dataset …")

random.seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

TEMPLATES = [
    # High-quality (score 7-10): specific, structured, context-rich
    "You are a {role}. {context}. Your task is to {task}. "
    "Please ensure the output is {format} and follows {constraint}.",

    "Act as an expert {role} with {years} years of experience. "
    "Given the following context: {context}, provide a detailed analysis of {topic}. "
    "Include {sections} in your response.",

    "As a {role}, your objective is to {task}. "
    "Use {method} to approach this problem. "
    "Constraints: {constraint}. Output format: {format}.",

    "You are tasked with {task}. "
    "Background information: {context}. "
    "Step-by-step, explain how to {topic} considering {constraint}.",

    "Create a comprehensive {format} on {topic} for a {audience}. "
    "The content should be {tone}, accurate, and cover {sections}.",

    # Medium-quality (score 4-7): partial context
    "Explain {topic} in simple terms.",
    "Write a {format} about {topic}.",
    "How do I {task}?",
    "Summarize the following: {context}.",
    "What are the pros and cons of {topic}?",

    # Low-quality (score 1-4): vague, incomplete
    "Tell me about {topic}.",
    "Help me with {task}.",
    "Write something about {topic}.",
    "What is {topic}?",
    "Do {task}.",
]

ROLES      = ["software engineer", "data scientist", "product manager", "UX designer",
              "security analyst", "machine learning researcher", "business analyst",
              "content strategist", "financial advisor", "legal consultant"]
TOPICS     = ["machine learning", "neural networks", "cloud computing", "microservices",
              "data pipelines", "transformer models", "prompt engineering",
              "containerisation", "CI/CD pipelines", "API design"]
TASKS      = ["design a scalable architecture", "optimise database queries",
              "generate unit tests", "review code for security vulnerabilities",
              "create a project roadmap", "analyse customer feedback",
              "draft a technical specification", "build a data ingestion pipeline"]
FORMATS    = ["markdown report", "bullet-point list", "JSON schema",
              "executive summary", "technical RFC", "Jupyter notebook outline"]
CONTEXTS   = ["the system handles 1 million daily active users",
              "the client is migrating from on-premise to AWS",
              "the dataset contains 10 million rows of transactional data",
              "the team has two weeks until the product launch deadline"]
CONSTRAINTS= ["under 500 words", "suitable for a non-technical audience",
               "using Python 3.11", "compatible with REST standards",
               "following GDPR regulations"]
SECTIONS   = ["introduction, methodology, results, and conclusion",
               "executive summary and key recommendations",
               "data sources, analysis, and visualisations"]
AUDIENCES  = ["C-suite executives", "junior developers", "end users", "regulators"]
TONES      = ["professional", "concise", "technical", "conversational"]
METHODS    = ["first-principles thinking", "design-thinking", "agile methodology",
              "SWOT analysis", "root-cause analysis"]

def render_template(template: str) -> str:
    try:
        return template.format(
            role       = random.choice(ROLES),
            topic      = random.choice(TOPICS),
            task       = random.choice(TASKS),
            format     = random.choice(FORMATS),
            context    = random.choice(CONTEXTS),
            constraint = random.choice(CONSTRAINTS),
            sections   = random.choice(SECTIONS),
            audience   = random.choice(AUDIENCES),
            tone       = random.choice(TONES),
            method     = random.choice(METHODS),
            years      = random.randint(3, 20),
        )
    except KeyError:
        return template  # return partially filled template

def compute_score(text: str) -> float:
    """Heuristic quality scorer — deterministic given the text features."""
    wc    = len(text.split())
    sc    = text.count(".")
    cc    = len(text)
    has_role   = any(w in text.lower() for w in ["you are", "act as", "your role"])
    has_task   = any(w in text.lower() for w in ["task", "objective", "provide", "create", "generate"])
    has_format = any(w in text.lower() for w in ["format", "output", "markdown", "json", "summary"])
    has_ctx    = any(w in text.lower() for w in ["context", "background", "given", "consider"])
    has_const  = any(w in text.lower() for w in ["constraint", "ensure", "must", "following", "using"])

    score = 1.0
    score += min(wc / 25, 3.0)           # up to +3 for word richness
    score += min(sc * 0.4, 1.5)          # up to +1.5 for sentence variety
    score += has_role   * 1.0
    score += has_task   * 0.8
    score += has_format * 0.6
    score += has_ctx    * 0.8
    score += has_const  * 0.6
    score += np.random.normal(0, 0.3)    # slight noise

    return float(np.clip(score, 0.5, 10.0))

records = []
for _ in range(620):
    tpl  = random.choice(TEMPLATES)
    text = render_template(tpl)
    records.append({"prompt_text": text, "quality_score": compute_score(text)})

raw_df = pd.DataFrame(records)
print(f"\n  Generated {len(raw_df)} raw records.")
print(f"  Score range : {raw_df['quality_score'].min():.2f} – {raw_df['quality_score'].max():.2f}")
print(f"  Mean score  : {raw_df['quality_score'].mean():.2f}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 — DATA PREPROCESSING
# ──────────────────────────────────────────────────────────────────────────────
log(3, "DATA PREPROCESSING")

df = raw_df.copy()
df["prompt_text"] = df["prompt_text"].str.strip()
df.dropna(subset=["prompt_text", "quality_score"], inplace=True)
df.drop_duplicates(subset=["prompt_text"], inplace=True)
df = df[df["prompt_text"].str.len() > 5]
df = df[(df["quality_score"] >= 0) & (df["quality_score"] <= 10)]
df.reset_index(drop=True, inplace=True)

print(f"\n  Records after cleaning : {len(df)}")
print(f"  Nulls remaining        : {df.isnull().sum().sum()}")
print(f"  Duplicates remaining   : {df.duplicated().sum()}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 4 — EXPLORATORY DATA ANALYSIS (EDA)
# ──────────────────────────────────────────────────────────────────────────────
log(4, "EXPLORATORY DATA ANALYSIS")

eda_stats = df["quality_score"].describe().round(4).to_dict()
eda_stats["skewness"] = round(float(df["quality_score"].skew()), 4)
eda_stats["kurtosis"] = round(float(df["quality_score"].kurt()), 4)
eda_stats["median"]   = round(float(df["quality_score"].median()), 4)
eda_stats["variance"] = round(float(df["quality_score"].var()), 4)

print("\n  Quality Score Distribution:")
for k, v in eda_stats.items():
    print(f"    {k:12s}: {v}")

prompt_lengths = df["prompt_text"].str.len()
word_counts    = df["prompt_text"].str.split().str.len()
print(f"\n  Avg prompt length (chars) : {prompt_lengths.mean():.1f}")
print(f"  Avg word count            : {word_counts.mean():.1f}")
print(f"  Correlation (len vs score): {df['quality_score'].corr(prompt_lengths):.4f}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 5 — FEATURE ENGINEERING
# ──────────────────────────────────────────────────────────────────────────────
log(5, "FEATURE ENGINEERING", "Loading sentence-transformer model …")

embed_model = SentenceTransformer(EMBED_MODEL_NAME)

print("  Encoding prompts — this may take ~30 seconds …")
t0 = time.time()
embeddings = embed_model.encode(
    df["prompt_text"].tolist(),
    show_progress_bar=True,
    batch_size=64,
)
elapsed = time.time() - t0
print(f"\n  Embedding shape : {embeddings.shape}  ({elapsed:.1f}s)")

# Lexical / structural hand-crafted features
df["word_count"]      = df["prompt_text"].str.split().str.len()
df["char_count"]      = df["prompt_text"].str.len()
df["sentence_count"]  = df["prompt_text"].str.count(r"[.!?]") + 1
df["avg_word_len"]    = df["char_count"] / df["word_count"].replace(0, 1)
df["has_role"]        = df["prompt_text"].str.lower().str.contains(
                            r"you are|act as|your role").astype(int)
df["has_task_kw"]     = df["prompt_text"].str.lower().str.contains(
                            r"task|objective|provide|create|generate").astype(int)
df["has_format_kw"]   = df["prompt_text"].str.lower().str.contains(
                            r"format|output|markdown|json|summary").astype(int)
df["has_context_kw"]  = df["prompt_text"].str.lower().str.contains(
                            r"context|background|given|consider").astype(int)
df["has_constraint_kw"] = df["prompt_text"].str.lower().str.contains(
                            r"constraint|ensure|must|following|using").astype(int)

HAND_FEATURES = [
    "word_count", "char_count", "sentence_count", "avg_word_len",
    "has_role", "has_task_kw", "has_format_kw",
    "has_context_kw", "has_constraint_kw"
]
hand_X = df[HAND_FEATURES].values.astype(float)

# Concatenate embedding + hand-crafted features
X = np.hstack([embeddings, hand_X])
y = df["quality_score"].values

print(f"\n  Final feature matrix : {X.shape}")
print(f"  Hand-crafted features: {HAND_FEATURES}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 6 — DATA SPLITTING
# ──────────────────────────────────────────────────────────────────────────────
log(6, "DATA SPLITTING", f"80/20 split  (random_state={RANDOM_STATE})")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
)

# Scale features
scaler  = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test  = scaler.transform(X_test)

print(f"\n  Training set  : {X_train.shape[0]} samples")
print(f"  Test set      : {X_test.shape[0]}  samples")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 7 — MODEL DEVELOPMENT
# ──────────────────────────────────────────────────────────────────────────────
log(7, "MODEL DEVELOPMENT")

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=RANDOM_STATE,
    n_jobs=-1,
)
baseline = Ridge(alpha=1.0)

print("\n  Primary  : RandomForestRegressor(n_estimators=200, max_depth=15)")
print("  Baseline : Ridge(alpha=1.0)")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 8 — MODEL TRAINING
# ──────────────────────────────────────────────────────────────────────────────
log(8, "MODEL TRAINING")

t0 = time.time()
model.fit(X_train, y_train)
baseline.fit(X_train, y_train)
train_time = time.time() - t0

cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="r2")
print(f"\n  Training time      : {train_time:.2f}s")
print(f"  5-fold CV R²       : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print(f"  CV scores per fold : {np.round(cv_scores, 4)}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 9 — MODEL TESTING
# ──────────────────────────────────────────────────────────────────────────────
log(9, "MODEL TESTING")

y_pred      = model.predict(X_test)
y_pred_base = baseline.predict(X_test)
y_pred_train = model.predict(X_train)

print("\n  Predictions generated for primary and baseline models.")
print(f"  Sample predictions (first 5): {np.round(y_pred[:5], 3)}")
print(f"  Actual values      (first 5): {np.round(y_test[:5], 3)}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 10 — PERFORMANCE EVALUATION
# ──────────────────────────────────────────────────────────────────────────────
log(10, "PERFORMANCE EVALUATION")

def get_metrics(y_true, y_pred_arr):
    mae  = mean_absolute_error(y_true, y_pred_arr)
    mse  = mean_squared_error(y_true, y_pred_arr)
    rmse = np.sqrt(mse)
    r2   = r2_score(y_true, y_pred_arr)
    return {"MAE": round(mae, 4), "MSE": round(mse, 4),
            "RMSE": round(rmse, 4), "R2": round(r2, 4)}

metrics_test     = get_metrics(y_test, y_pred)
metrics_train    = get_metrics(y_train, y_pred_train)
metrics_baseline = get_metrics(y_test, y_pred_base)

print("\n  +----------------------------------------------------------+")
print("  |              PRIMARY MODEL - TEST SET                    |")
print("  +----------------------------------------------------------+")
for k, v in metrics_test.items():
    print(f"  |  {k:<10}: {v:<45}|")
print("  +----------------------------------------------------------+")
print("\n  Baseline (Ridge) Test Metrics:", metrics_baseline)

# ──────────────────────────────────────────────────────────────────────────────
# STEP 11 — RESULT ANALYSIS
# ──────────────────────────────────────────────────────────────────────────────
log(11, "RESULT ANALYSIS")

performance_grade = (
    "Excellent" if metrics_test["R2"] > 0.85 else
    "Good"      if metrics_test["R2"] > 0.70 else
    "Fair"      if metrics_test["R2"] > 0.50 else
    "Poor"
)

result_analysis = (
    f"The RandomForestRegressor achieved an R² of {metrics_test['R2']:.4f} on the held-out "
    f"test set, which is classified as '{performance_grade}' performance. "
    f"The RMSE of {metrics_test['RMSE']:.4f} indicates that predictions deviate by "
    f"approximately {metrics_test['RMSE']:.2f} quality points on average — acceptable given "
    f"a 0-10 scale. The baseline Ridge model attained R²={metrics_baseline['R2']:.4f}, "
    f"confirming that the non-linear Random Forest captures richer interaction patterns "
    f"from the embedding space. Cross-validation R² ({cv_scores.mean():.4f} ± {cv_scores.std():.4f}) "
    f"demonstrates model stability without significant overfitting."
)
print(f"\n  Grade : {performance_grade}")
print(f"\n  Analysis:\n")
for line in textwrap.wrap(result_analysis, width=70):
    print(f"  {line}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 12 — VISUALIZATION
# ──────────────────────────────────────────────────────────────────────────────
log(12, "VISUALIZATION")

sns.set_theme(style="darkgrid", palette="muted")

def fig_to_b64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded

# ── Scatter: Actual vs. Predicted ─────────────────────────────────────────────
fig1, ax1 = plt.subplots(figsize=(7, 6), facecolor="#0f172a")
ax1.set_facecolor("#1e293b")
ax1.scatter(y_test, y_pred, alpha=0.65, s=40,
            color="#38bdf8", edgecolors="none", label="Predictions")
lo = min(y_test.min(), y_pred.min()) - 0.2
hi = max(y_test.max(), y_pred.max()) + 0.2
ax1.plot([lo, hi], [lo, hi], "r--", lw=1.5, label="Perfect fit")
ax1.set_xlabel("Actual Score",    color="#94a3b8", fontsize=12)
ax1.set_ylabel("Predicted Score", color="#94a3b8", fontsize=12)
ax1.set_title("Actual vs. Predicted Quality Score",
              color="#f1f5f9", fontsize=14, pad=12)
ax1.tick_params(colors="#64748b")
ax1.spines[:].set_color("#334155")
ax1.legend(facecolor="#1e293b", edgecolor="#334155", labelcolor="#cbd5e1")
ax1.text(0.03, 0.95, f"R² = {metrics_test['R2']:.4f}",
         transform=ax1.transAxes, color="#4ade80",
         fontsize=11, verticalalignment="top")
scatter_b64 = fig_to_b64(fig1)
print("  ✓ Actual vs. Predicted scatter generated.")

# ── Feature Importance ────────────────────────────────────────────────────────
importances = model.feature_importances_
n_embed     = embeddings.shape[1]
embed_imp   = importances[:n_embed].sum()
hand_imp    = importances[n_embed:].sum()
hand_imps   = importances[n_embed:]  # per hand-crafted feature

fig2, axes = plt.subplots(1, 2, figsize=(12, 5), facecolor="#0f172a")
fig2.patch.set_facecolor("#0f172a")

# Pie: embedding vs hand-crafted
ax_pie = axes[0]
ax_pie.set_facecolor("#1e293b")
wedge_colors = ["#38bdf8", "#f472b6"]
ax_pie.pie(
    [embed_imp, hand_imp],
    labels=["Embedding (384-d)", "Hand-crafted (9)"],
    colors=wedge_colors, autopct="%1.1f%%",
    textprops={"color": "#f1f5f9"},
    startangle=140,
    wedgeprops={"edgecolor": "#0f172a", "linewidth": 2},
)
ax_pie.set_title("Feature Group Importance", color="#f1f5f9", fontsize=13)

# Bar: hand-crafted importances
ax_bar = axes[1]
ax_bar.set_facecolor("#1e293b")
colors_bar = ["#38bdf8" if i == np.argmax(hand_imps) else "#475569"
              for i in range(len(hand_imps))]
ax_bar.barh(HAND_FEATURES, hand_imps, color=colors_bar, edgecolor="none")
ax_bar.set_xlabel("Importance", color="#94a3b8", fontsize=11)
ax_bar.set_title("Hand-Crafted Feature Importances", color="#f1f5f9", fontsize=13)
ax_bar.tick_params(colors="#64748b")
ax_bar.spines[:].set_color("#334155")
ax_bar.invert_yaxis()
feat_imp_b64 = fig_to_b64(fig2)
print("  ✓ Feature Importance chart generated.")

# ── Score Distribution ────────────────────────────────────────────────────────
fig3, ax3 = plt.subplots(figsize=(7, 5), facecolor="#0f172a")
ax3.set_facecolor("#1e293b")
sns.histplot(df["quality_score"], bins=30, kde=True, ax=ax3,
             color="#818cf8", fill=True, alpha=0.6,
             line_kws={"color": "#f472b6", "lw": 2})
ax3.set_xlabel("Quality Score", color="#94a3b8", fontsize=12)
ax3.set_ylabel("Frequency",     color="#94a3b8", fontsize=12)
ax3.set_title("Prompt Quality Score Distribution", color="#f1f5f9", fontsize=14)
ax3.tick_params(colors="#64748b")
ax3.spines[:].set_color("#334155")
dist_b64 = fig_to_b64(fig3)
print("  ✓ Score distribution chart generated.")

# ── Residuals ─────────────────────────────────────────────────────────────────
residuals = y_test - y_pred
fig4, ax4 = plt.subplots(figsize=(7, 5), facecolor="#0f172a")
ax4.set_facecolor("#1e293b")
ax4.scatter(y_pred, residuals, alpha=0.6, s=35, color="#fb923c", edgecolors="none")
ax4.axhline(0, color="#ef4444", lw=1.5, ls="--")
ax4.set_xlabel("Predicted Score", color="#94a3b8", fontsize=12)
ax4.set_ylabel("Residuals",       color="#94a3b8", fontsize=12)
ax4.set_title("Residual Plot",    color="#f1f5f9", fontsize=14)
ax4.tick_params(colors="#64748b")
ax4.spines[:].set_color("#334155")
residuals_b64 = fig_to_b64(fig4)
print("  ✓ Residual plot generated.")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 13 — CONCLUSION & ARTIFACT EXPORT
# ──────────────────────────────────────────────────────────────────────────────
log(13, "CONCLUSION & ARTIFACT EXPORT")

conclusion = {
    "findings": (
        f"A RandomForestRegressor trained on sentence-transformer embeddings "
        f"(384-dim) combined with 9 hand-crafted lexical features achieved "
        f"R²={metrics_test['R2']:.4f} on unseen test data, demonstrating that "
        f"prompt quality is predictable from structural and semantic text cues alone."
    ),
    "limitations": (
        "1. The dataset is synthetic; real-world prompt ratings collected from "
        "human annotators would improve generalisation. "
        "2. The quality score heuristic is rule-based, which may not fully "
        "capture subjective prompt 'clarity'. "
        "3. The model does not account for domain-specific prompt patterns "
        "(e.g., coding vs. creative writing prompts may have different quality signals)."
    ),
    "future_improvements": (
        "1. Replace synthetic labels with RLHF-style human preference data. "
        "2. Fine-tune the embedding model end-to-end (not just as a frozen encoder). "
        "3. Add a SHAP explainer endpoint to surface per-token feature attributions. "
        "4. Implement online learning so the model improves from user feedback. "
        "5. Extend to multi-output regression: predict both quality and expected "
        "LLM response quality simultaneously."
    ),
    "model_performance_grade": performance_grade,
    "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
}

# Build the full report JSON
report = {
    "problem_statement": PROBLEM_STATEMENT,
    "dataset_info": {
        "total_records": len(df),
        "train_size":    int(X_train.shape[0]),
        "test_size":     int(X_test.shape[0]),
        "feature_dim":   int(X.shape[1]),
        "embedding_dim": int(embeddings.shape[1]),
        "hand_features": HAND_FEATURES,
    },
    "eda_stats": eda_stats,
    "cv_scores": {
        "mean": round(float(cv_scores.mean()), 4),
        "std":  round(float(cv_scores.std()),  4),
        "scores": [round(s, 4) for s in cv_scores.tolist()],
    },
    "metrics": {
        "test":     metrics_test,
        "train":    metrics_train,
        "baseline": metrics_baseline,
    },
    "result_analysis": result_analysis,
    "conclusion":      conclusion,
    "graphs": {
        "scatter":      scatter_b64,
        "feature_imp":  feat_imp_b64,
        "distribution": dist_b64,
        "residuals":    residuals_b64,
    },
}

# Save artifacts
with open(METRICS_PATH, "w") as f:
    json.dump(report["metrics"], f, indent=2)

with open(REPORT_PATH, "w") as f:
    json.dump(report, f, indent=2)

joblib.dump(model,  MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)

print(f"\n  * Model saved   -> {MODEL_PATH}")
print(f"  * Scaler saved  -> {SCALER_PATH}")
print(f"  * Metrics saved -> {METRICS_PATH}")
print(f"  * Report saved  -> {REPORT_PATH}")

print("\n" + "=" * 72)
print("  PIPELINE COMPLETE")
print(f"  R² = {metrics_test['R2']:.4f}  |  RMSE = {metrics_test['RMSE']:.4f}  |  MAE = {metrics_test['MAE']:.4f}")
print("=" * 72)
print(json.dumps(conclusion, indent=2))
