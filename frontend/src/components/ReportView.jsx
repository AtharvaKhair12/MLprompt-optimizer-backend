import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart3, TrendingUp, AlertCircle, Loader2, RefreshCw,
  Activity, Database, GitBranch, Microscope, Award,
  Target, ChevronDown, ChevronUp, BookOpen, Lightbulb,
  FlaskConical, CheckCircle
} from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const API = '/api'

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, suffix = '', icon: Icon, color, description }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-surface-600 font-semibold">
          {label}
        </span>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-surface-50 tracking-tight">
          {value}
          <span className="text-sm text-surface-600 font-normal ml-1">{suffix}</span>
        </p>
        {description && (
          <p className="text-[11px] text-surface-600 mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color = '#6366f1', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-700/30 transition-colors"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <span className="flex-1 text-sm font-semibold text-surface-200">{title}</span>
        {open ? <ChevronUp size={14} className="text-surface-600" /> : <ChevronDown size={14} className="text-surface-600" />}
      </button>
      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="divider mb-4" />
          {children}
        </div>
      )}
    </div>
  )
}

// ── Metric row ────────────────────────────────────────────────────────────────
function MetricRow({ label, primary, train, baseline }) {
  return (
    <div className="grid grid-cols-4 gap-3 py-2 border-b border-surface-700/50 last:border-0">
      <span className="text-sm text-surface-400 font-medium">{label}</span>
      <span className="text-sm font-bold text-brand-300 font-mono">{primary}</span>
      <span className="text-sm text-surface-500 font-mono">{train}</span>
      <span className="text-sm text-surface-600 font-mono">{baseline}</span>
    </div>
  )
}

// ── Base64 chart image ────────────────────────────────────────────────────────
function ChartImage({ b64, alt }) {
  if (!b64) return null
  return (
    <div className="rounded-xl overflow-hidden border border-surface-700 bg-surface-950">
      <img
        src={`data:image/png;base64,${b64}`}
        alt={alt}
        className="w-full h-auto"
      />
    </div>
  )
}

// ── Bar chart for CV scores ───────────────────────────────────────────────────
function CvScoresChart({ scores }) {
  const data = scores.map((s, i) => ({ fold: `Fold ${i + 1}`, r2: s }))
  return (
    <ResponsiveContainer width="100%" height={160}>
      <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="fold" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#818cf8' }}
        />
        <ReferenceLine y={scores.reduce((a,b) => a+b,0)/scores.length} stroke="#f472b6" strokeDasharray="4 2" />
        <Scatter data={data} dataKey="r2" fill="#818cf8" r={6} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ReportView() {
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get(`${API}/report`)
      setReport(data)
    } catch (err) {
      setError(
        err.response?.status === 503
          ? 'Report not available. Please run train_pipeline.py first.'
          : err.response?.data?.detail || 'Failed to load report.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [])

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center">
          <Loader2 size={28} className="text-brand-400 animate-spin" />
        </div>
        <p className="text-surface-400 font-semibold">Loading ML Training Report…</p>
        <p className="text-sm text-surface-600">Fetching metrics, graphs, and analysis</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <div>
          <p className="text-surface-200 font-semibold">{error}</p>
          <p className="text-sm text-surface-600 mt-1 max-w-md">
            The training pipeline must be executed before viewing the report.
          </p>
        </div>
        <div className="code-block text-xs max-w-sm">
          cd backend<br/>
          python train_pipeline.py
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  const { metrics, eda_stats, cv_scores, dataset_info,
          problem_statement, result_analysis, conclusion, graphs } = report

  const m = metrics.test
  const perfColor = m.R2 >= 0.85 ? '#4ade80' : m.R2 >= 0.70 ? '#818cf8' : m.R2 >= 0.50 ? '#fbbf24' : '#f87171'

  const WORKFLOW_STEPS = [
    { label: 'Problem Definition',    icon: Target },
    { label: 'Data Collection',       icon: Database },
    { label: 'Preprocessing',         icon: FlaskConical },
    { label: 'Feature Engineering',   icon: GitBranch },
    { label: 'Model Development',     icon: Microscope },
    { label: 'Training',              icon: Activity },
    { label: 'Testing',               icon: BookOpen },
    { label: 'Evaluation',            icon: BarChart3 },
    { label: 'Result Analysis',       icon: TrendingUp },
    { label: 'Conclusion',            icon: Lightbulb },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-surface-700 bg-surface-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-surface-50 tracking-tight flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-400" />
              ML Training Report
            </h1>
            <p className="text-xs text-surface-600 mt-0.5">
              Academic workflow · RandomForestRegressor · all-MiniLM-L6-v2 embeddings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="stat-badge">
              <Database size={11} />
              {dataset_info.total_records} samples
            </div>
            <div className="stat-badge" style={{ color: perfColor }}>
              <Award size={11} />
              {conclusion?.model_performance_grade}
            </div>
            <button
              onClick={fetchReport}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-800 hover:text-surface-300 transition-all"
              title="Refresh report"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Academic Workflow Pipeline ───────────────────────── */}
        <div className="glass rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-surface-600 font-semibold mb-4">
            Academic Workflow Pipeline
          </p>
          <div className="flex flex-wrap gap-2">
            {WORKFLOW_STEPS.map(({ label, icon: Icon }, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-600/15 border border-brand-500/25">
                  <CheckCircle size={12} className="text-brand-400" />
                  <span className="text-xs text-brand-300 font-medium">{label}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="w-4 h-px bg-surface-700" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="R² Score"
            value={m.R2.toFixed(4)}
            icon={TrendingUp}
            color={perfColor}
            description="Coefficient of determination"
          />
          <KpiCard
            label="RMSE"
            value={m.RMSE.toFixed(4)}
            icon={Activity}
            color="#22d3ee"
            description="Root Mean Squared Error"
          />
          <KpiCard
            label="MAE"
            value={m.MAE.toFixed(4)}
            icon={Target}
            color="#f472b6"
            description="Mean Absolute Error"
          />
          <KpiCard
            label="MSE"
            value={m.MSE.toFixed(4)}
            icon={BarChart3}
            color="#fbbf24"
            description="Mean Squared Error"
          />
        </div>

        {/* ── Problem Statement ─────────────────────────────────── */}
        <Section title="Problem Definition" icon={Target} color="#818cf8">
          <p className="text-sm text-surface-300 leading-relaxed">{problem_statement}</p>
        </Section>

        {/* ── Dataset Info ──────────────────────────────────────── */}
        <Section title="Dataset & Feature Engineering" icon={Database} color="#22d3ee">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider mb-3">
                Dataset Statistics
              </p>
              {[
                { label: 'Total Records',       value: dataset_info.total_records },
                { label: 'Training Samples',    value: dataset_info.train_size },
                { label: 'Test Samples',         value: dataset_info.test_size },
                { label: 'Embedding Dimension', value: `${dataset_info.embedding_dim}-d` },
                { label: 'Total Feature Dim.',  value: `${dataset_info.feature_dim}-d` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-surface-700/50">
                  <span className="text-sm text-surface-500">{label}</span>
                  <span className="text-sm font-semibold text-surface-200 font-mono">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider mb-3">
                Hand-Crafted Features
              </p>
              <div className="flex flex-wrap gap-2">
                {dataset_info.hand_features.map(f => (
                  <span key={f} className="stat-badge text-[11px]">{f}</span>
                ))}
              </div>
              <p className="text-xs text-surface-600 mt-3 leading-relaxed">
                Features are concatenated with {dataset_info.embedding_dim}-dimensional
                sentence-transformer embeddings from <code className="text-brand-400 text-[11px]">all-MiniLM-L6-v2</code>.
              </p>
            </div>
          </div>
        </Section>

        {/* ── EDA ──────────────────────────────────────────────── */}
        <Section title="Exploratory Data Analysis (EDA)" icon={Microscope} color="#f472b6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider mb-3">
                Quality Score Distribution
              </p>
              {Object.entries(eda_stats).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-surface-700/40">
                  <span className="text-sm text-surface-500 capitalize">{k.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-surface-200 font-mono">
                    {typeof v === 'number' ? v.toFixed(4) : v}
                  </span>
                </div>
              ))}
            </div>
            <div>
              {graphs?.distribution && (
                <ChartImage b64={graphs.distribution} alt="Score Distribution" />
              )}
            </div>
          </div>
        </Section>

        {/* ── Metrics Table ─────────────────────────────────────── */}
        <Section title="Model Performance Comparison" icon={BarChart3} color="#4ade80">
          <div>
            <div className="grid grid-cols-4 gap-3 pb-2 mb-1">
              {['Metric', 'RandomForest (Test)', 'RandomForest (Train)', 'Ridge Baseline'].map(h => (
                <span key={h} className="text-[10px] uppercase tracking-wider text-surface-600 font-semibold">{h}</span>
              ))}
            </div>
            {['MAE', 'MSE', 'RMSE', 'R2'].map(k => (
              <MetricRow
                key={k}
                label={k}
                primary={metrics.test[k]}
                train={metrics.train[k]}
                baseline={metrics.baseline[k]}
              />
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-surface-900 border border-surface-700">
            <p className="text-xs text-surface-500 leading-relaxed">
              <span className="text-brand-300 font-semibold">Cross-Validation R²:</span>{' '}
              {cv_scores.mean.toFixed(4)} ± {cv_scores.std.toFixed(4)} (5-fold)
            </p>
          </div>
        </Section>

        {/* ── Cross-Validation Scores ───────────────────────────── */}
        <Section title="5-Fold Cross-Validation R² Scores" icon={GitBranch} color="#fbbf24">
          <CvScoresChart scores={cv_scores.scores} />
          <p className="text-xs text-surface-600 mt-2 text-center">
            Pink dashed line = mean R² across folds. Each dot represents one validation fold.
          </p>
        </Section>

        {/* ── Scatter Plot ──────────────────────────────────────── */}
        <Section title="Actual vs. Predicted — Scatter Plot" icon={Activity} color="#22d3ee">
          {graphs?.scatter && (
            <ChartImage b64={graphs.scatter} alt="Actual vs Predicted" />
          )}
        </Section>

        {/* ── Feature Importance ───────────────────────────────── */}
        <Section title="Feature Importance Analysis" icon={TrendingUp} color="#c084fc">
          {graphs?.feature_imp && (
            <ChartImage b64={graphs.feature_imp} alt="Feature Importance" />
          )}
        </Section>

        {/* ── Residual Plot ─────────────────────────────────────── */}
        <Section title="Residual Plot" icon={Microscope} color="#fb923c">
          {graphs?.residuals && (
            <ChartImage b64={graphs.residuals} alt="Residuals" />
          )}
        </Section>

        {/* ── Result Analysis ───────────────────────────────────── */}
        <Section title="Result Analysis" icon={BookOpen} color="#4ade80">
          <p className="text-sm text-surface-300 leading-relaxed">{result_analysis}</p>
        </Section>

        {/* ── Conclusion ────────────────────────────────────────── */}
        {conclusion && (
          <Section title="Conclusion" icon={Lightbulb} color="#f472b6">
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-surface-600 font-semibold mb-2">
                  Findings
                </p>
                <p className="text-sm text-surface-300 leading-relaxed">{conclusion.findings}</p>
              </div>
              <div className="divider" />
              <div>
                <p className="text-xs uppercase tracking-wider text-surface-600 font-semibold mb-2">
                  Limitations
                </p>
                <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-line">
                  {conclusion.limitations}
                </p>
              </div>
              <div className="divider" />
              <div>
                <p className="text-xs uppercase tracking-wider text-surface-600 font-semibold mb-2">
                  Future Improvements
                </p>
                <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-line">
                  {conclusion.future_improvements}
                </p>
              </div>
              <div className="divider" />
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ background: `${perfColor}15`, border: `1px solid ${perfColor}40`, color: perfColor }}
                >
                  <Award size={14} />
                  {conclusion.model_performance_grade} Performance
                </div>
                <span className="text-xs text-surface-600">
                  Trained {conclusion.training_date}
                </span>
              </div>
            </div>
          </Section>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
