import React, { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import {
  Zap, Sparkles, RotateCcw, Copy, Check, AlertCircle,
  ChevronRight, Clock, Hash, AlignLeft, Target, ListChecks,
  Info, CheckCircle2, Loader2, ArrowRight
} from 'lucide-react'
import ScoreGauge from './ScoreGauge'
import FeatureFlags from './FeatureFlags'

const API = '/api'

const PLACEHOLDER = `Enter your prompt here…

Example: "Explain machine learning"

Try something specific for a better score, like:
"You are a senior ML engineer. Explain transformer attention mechanisms
to a junior developer using analogies. Include a Python code snippet,
keep it under 400 words, and use bullet points for key concepts."`

export default function OptimizerView() {
  const [prompt, setPrompt] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [optimized, setOptimized] = useState(null)
  const [evalLoading,  setEvalLoading]  = useState(false)
  const [optLoading,   setOptLoading]   = useState(false)
  const [evalError,    setEvalError]    = useState(null)
  const [optError,     setOptError]     = useState(null)
  const [copied, setCopied] = useState(false)

  const textareaRef = useRef(null)

  // ── Evaluate ────────────────────────────────────────────────────
  const handleEvaluate = useCallback(async () => {
    if (!prompt.trim()) return
    setEvalLoading(true)
    setEvalError(null)
    try {
      const { data } = await axios.post(`${API}/evaluate`, { prompt: prompt.trim() })
      setEvaluation(data)
    } catch (err) {
      setEvalError(err.response?.data?.detail || 'Evaluation failed. Is the backend running?')
    } finally {
      setEvalLoading(false)
    }
  }, [prompt])

  // ── Optimize ────────────────────────────────────────────────────
  const handleOptimize = useCallback(async () => {
    if (!prompt.trim()) return
    setOptLoading(true)
    setOptError(null)
    try {
      const { data } = await axios.post(`${API}/optimize`, { prompt: prompt.trim() })
      setOptimized(data)
    } catch (err) {
      setOptError(err.response?.data?.detail || 'Optimization failed. Check your Groq API key.')
    } finally {
      setOptLoading(false)
    }
  }, [prompt])

  // ── Copy ────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!optimized) return
    navigator.clipboard.writeText(optimized.optimized_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [optimized])

  // ── Use optimized ───────────────────────────────────────────────
  const handleUseOptimized = useCallback(() => {
    if (!optimized) return
    setPrompt(optimized.optimized_prompt)
    setOptimized(null)
    setEvaluation(null)
  }, [optimized])

  const charCount = prompt.length
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-surface-700 bg-surface-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-surface-50 tracking-tight flex items-center gap-2">
              <Zap size={18} className="text-brand-400" />
              Live Prompt Optimizer
            </h1>
            <p className="text-xs text-surface-600 mt-0.5">
              ML-powered quality scoring &amp; Groq LLM rewriting
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="stat-badge">
              <Hash size={11} />
              {wordCount} words
            </div>
            <div className="stat-badge">
              <AlignLeft size={11} />
              {charCount} chars
            </div>
          </div>
        </div>
      </header>

      {/* ── Body — Split Pane ─────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex gap-0">

        {/* ── LEFT PANE: Input ──────────────────────────────────── */}
        <div className="w-1/2 border-r border-surface-700 flex flex-col overflow-hidden">
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">

            {/* Textarea */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-widest">
                Your Prompt
              </label>
              <textarea
                ref={textareaRef}
                className="prompt-textarea h-56 font-mono text-sm"
                placeholder={PLACEHOLDER}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.ctrlKey && e.key === 'Enter') handleEvaluate()
                }}
              />
              <p className="text-[10px] text-surface-700">
                Tip: Press <kbd className="px-1 py-0.5 bg-surface-800 rounded text-surface-500 font-mono">Ctrl+Enter</kbd> to evaluate quickly
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEvaluate}
                disabled={!prompt.trim() || evalLoading}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-xl font-semibold text-sm
                  bg-brand-600 hover:bg-brand-500 text-white
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-glow-brand
                  hover:shadow-[0_0_28px_rgba(99,102,241,0.5)]
                "
              >
                {evalLoading
                  ? <><Loader2 size={15} className="animate-spin" /> Evaluating…</>
                  : <><Target size={15} /> Evaluate Score</>
                }
              </button>

              <button
                onClick={handleOptimize}
                disabled={!prompt.trim() || optLoading}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-violet-600 to-cyan-500
                  hover:from-violet-500 hover:to-cyan-400 text-white
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200
                  hover:shadow-[0_0_28px_rgba(139,92,246,0.4)]
                "
              >
                {optLoading
                  ? <><Loader2 size={15} className="animate-spin" /> Optimizing…</>
                  : <><Sparkles size={15} /> Optimize with AI</>
                }
              </button>

              <button
                onClick={() => { setPrompt(''); setEvaluation(null); setOptimized(null) }}
                className="
                  px-3 py-2.5 rounded-xl text-surface-500
                  hover:bg-surface-800 hover:text-surface-300
                  transition-all duration-200
                "
                title="Clear"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Error */}
            {evalError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{evalError}</span>
              </div>
            )}

            {/* Evaluation Results */}
            {evaluation && (
              <div className="animate-slide-up space-y-4">
                <div className="divider" />

                {/* Score Gauge */}
                <div className="flex items-center gap-5 p-4 glass rounded-2xl">
                  <ScoreGauge score={evaluation.score} />
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-surface-50">
                      {evaluation.score.toFixed(2)}
                      <span className="text-sm text-surface-600 font-normal"> / 10</span>
                    </p>
                    <p className="text-sm text-surface-500 mt-0.5">
                      Grade:&nbsp;
                      <span className={`font-semibold ${
                        evaluation.grade === 'Excellent' ? 'text-accent-green' :
                        evaluation.grade === 'Good' ? 'text-brand-400' :
                        evaluation.grade === 'Fair' ? 'text-accent-amber' : 'text-accent-red'
                      }`}>
                        {evaluation.grade}
                      </span>
                    </p>
                    <p className="text-[11px] text-surface-700 mt-1">
                      Inference: {evaluation.inference_ms.toFixed(1)} ms
                    </p>
                  </div>
                </div>

                {/* Feature Flags */}
                <FeatureFlags evaluation={evaluation} />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: Output ────────────────────────────────── */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">

            <label className="text-xs font-semibold text-surface-500 uppercase tracking-widest">
              Optimized Prompt
            </label>

            {/* Loading State */}
            {optLoading && (
              <div className="flex-1 flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center gap-3 p-4 glass rounded-2xl">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center animate-pulse-slow">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-200">Groq AI is rewriting your prompt…</p>
                    <p className="text-[11px] text-surface-600">Using qwen/qwen3.8-27b model</p>
                  </div>
                </div>
                {[120, 80, 100, 60].map((w, i) => (
                  <div key={i} className={`h-4 rounded-lg shimmer`} style={{ width: `${w}%` }} />
                ))}
                {[90, 70].map((w, i) => (
                  <div key={i} className={`h-4 rounded-lg shimmer`} style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

            {/* Error */}
            {optError && !optLoading && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{optError}</span>
              </div>
            )}

            {/* Empty State */}
            {!optimized && !optLoading && !optError && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center">
                  <Sparkles size={28} className="text-surface-600" />
                </div>
                <div>
                  <p className="text-surface-400 font-semibold">No optimized prompt yet</p>
                  <p className="text-sm text-surface-600 mt-1">
                    Write a prompt on the left and click&nbsp;
                    <span className="text-violet-400 font-medium">Optimize with AI</span>
                  </p>
                </div>
                <div className="mt-2 p-3 glass rounded-xl max-w-xs">
                  <p className="text-[11px] text-surface-600 leading-relaxed">
                    The Groq LLM will restructure your prompt with a clear role, context,
                    task definition, output format, and constraints.
                  </p>
                </div>
              </div>
            )}

            {/* Result */}
            {optimized && !optLoading && (
              <div className="animate-slide-up space-y-4">
                {/* Optimized text */}
                <div className="relative glass rounded-2xl p-4 group">
                  <pre className="whitespace-pre-wrap text-sm text-surface-200 font-sans leading-relaxed">
                    {optimized.optimized_prompt}
                  </pre>
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-surface-200 transition-all"
                      title="Copy"
                    >
                      {copied ? <Check size={13} className="text-accent-green" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Improvements */}
                <div className="p-4 glass rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks size={15} className="text-accent-cyan" />
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      What was improved
                    </p>
                  </div>
                  {optimized.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-surface-300">
                      <CheckCircle2 size={14} className="text-accent-green flex-shrink-0 mt-0.5" />
                      {imp}
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="stat-badge">
                      <Clock size={11} />
                      {optimized.inference_ms.toFixed(0)} ms
                    </div>
                    <div className="stat-badge">
                      <Sparkles size={11} />
                      {optimized.groq_model}
                    </div>
                  </div>
                  <button
                    onClick={handleUseOptimized}
                    className="
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                      bg-brand-600/20 border border-brand-500/30 text-brand-300
                      hover:bg-brand-600/30 transition-all
                    "
                  >
                    Use this prompt
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
