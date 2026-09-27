# AI Prompt Evaluator & Optimizer

An enterprise-grade, end-to-end Machine Learning application that **predicts prompt quality** using a RandomForestRegressor trained on sentence-transformer embeddings, and **rewrites prompts** using Groq's ultra-fast LLM API.

---

## Architecture

```
PromptOptimizerML/
├── backend/
│   ├── main.py               ← FastAPI server (port 8000)
│   ├── train_pipeline.py     ← 13-step ML training script
│   ├── requirements.txt
│   └── artifacts/            ← Generated after training
│       ├── prompt_quality_model.joblib
│       ├── scaler.joblib
│       ├── metrics.json
│       └── report.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── OptimizerView.jsx
    │   │   ├── ReportView.jsx
    │   │   ├── ScoreGauge.jsx
    │   │   └── FeatureFlags.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free Groq API key from [console.groq.com](https://console.groq.com)

---

### Step 1 — Set up Python backend

```powershell
# Navigate to backend
cd backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Step 2 — Configure Groq API Key

Create a `.env` file in the `backend/` directory:

```
GROQ_API_KEY=gsk_your_real_key_here
```

Or set it as an environment variable:

```powershell
$env:GROQ_API_KEY = "gsk_your_real_key_here"
```

### Step 3 — Run the ML Training Pipeline

```powershell
# From backend/ directory (venv activated)
python train_pipeline.py
```

This executes all 13 academic steps and generates:
- `artifacts/prompt_quality_model.joblib`
- `artifacts/scaler.joblib`
- `artifacts/report.json` (includes base64 charts)

**Expected runtime: ~2-5 minutes** (dominated by embedding encoding)

### Step 4 — Start the FastAPI Backend

```powershell
# From backend/ directory (venv activated)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: http://localhost:8000/docs

### Step 5 — Start the React Frontend

```powershell
# In a NEW terminal
cd frontend
npm install
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/`      | Health check |
| GET    | `/report` | Full ML training report (metrics, charts, analysis) |
| POST   | `/evaluate` | Predict quality score for a prompt |
| POST   | `/optimize` | Rewrite prompt with Groq LLM |

### POST /evaluate

**Request:**
```json
{ "prompt": "Explain machine learning" }
```

**Response:**
```json
{
  "score": 3.721,
  "grade": "Needs Improvement",
  "word_count": 3,
  "char_count": 26,
  "has_role": false,
  "has_task_kw": false,
  "inference_ms": 45.2
}
```

### POST /optimize

**Request:**
```json
{ "prompt": "Explain machine learning" }
```

**Response:**
```json
{
  "original_prompt": "Explain machine learning",
  "optimized_prompt": "You are a senior ML engineer...",
  "improvements": ["Added role definition", "Specified output format", ...],
  "groq_model": "llama3-70b-8192",
  "inference_ms": 1243.5
}
```

---

## ML Pipeline — 13 Academic Steps

| Step | Name | Description |
|------|------|-------------|
| 1 | Problem Definition | Regression: predict 0-10 quality score |
| 2 | Dataset Collection | 600 synthetic prompt-quality pairs |
| 3 | Preprocessing | Dedup, null handling, normalization |
| 4 | EDA | Descriptive statistics, distribution |
| 5 | Feature Engineering | 384-d embeddings + 9 hand-crafted features |
| 6 | Data Splitting | 80/20 train-test split, StandardScaler |
| 7 | Model Development | RandomForestRegressor + Ridge baseline |
| 8 | Model Training | 5-fold cross-validation |
| 9 | Model Testing | Test-set predictions |
| 10 | Evaluation | MAE, MSE, RMSE, R² |
| 11 | Result Analysis | Performance grading + narrative |
| 12 | Visualization | Scatter, feature importance, distribution, residuals |
| 13 | Conclusion | Findings, limitations, future work |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | FastAPI + Uvicorn |
| ML Model | Scikit-Learn RandomForestRegressor |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| LLM Optimization | Groq API (llama3-70b-8192) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts + Matplotlib |
| Data | Pandas + NumPy |
