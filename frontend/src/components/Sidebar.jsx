import React from 'react'
import {
  Brain, Zap, BarChart3, Sparkles, ChevronRight, Activity
} from 'lucide-react'

const NAV_ITEMS = [
  {
    id: 'optimizer',
    label: 'Live Optimizer',
    icon: Zap,
    description: 'Evaluate & rewrite prompts',
  },
  {
    id: 'report',
    label: 'Training Report',
    icon: BarChart3,
    description: 'Academic ML analysis',
  },
]

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside
      className="
        w-64 flex-shrink-0 flex flex-col
        bg-surface-900 border-r border-surface-700
        select-none
      "
    >
      {/* ── Brand ──────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-surface-700">
        <div className="flex items-center gap-3">
          <div
            className="
              w-9 h-9 rounded-xl flex items-center justify-center
              bg-gradient-to-br from-brand-500 to-accent-cyan
              shadow-glow-brand flex-shrink-0
            "
          >
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-700 text-surface-50 leading-tight tracking-tight">
              Prompt AI
            </p>
            <p className="text-[10px] text-surface-600 font-medium uppercase tracking-widest mt-0.5">
              ML Evaluator
            </p>
          </div>
        </div>
      </div>

      {/* ── Status Badge ───────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-surface-700">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-slow" />
          <span className="text-[11px] text-surface-600 font-medium">Backend Connected</span>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 pb-2 text-[10px] uppercase tracking-widest text-surface-600 font-semibold">
          Views
        </p>

        {NAV_ITEMS.map(({ id, label, icon: Icon, description }) => {
          const isActive = activeView === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-left transition-all duration-200 group
                ${isActive
                  ? 'bg-brand-600/20 border border-brand-500/30 text-brand-300'
                  : 'text-surface-500 hover:bg-surface-800 hover:text-surface-200 border border-transparent'
                }
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  transition-all duration-200
                  ${isActive
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'bg-surface-800 text-surface-500 group-hover:text-surface-300'
                  }
                `}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? 'text-brand-200' : ''}`}>
                  {label}
                </p>
                <p className="text-[10px] text-surface-600 truncate mt-0.5">
                  {description}
                </p>
              </div>
              {isActive && (
                <ChevronRight size={14} className="text-brand-400 flex-shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-surface-700">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={12} className="text-brand-400" />
          <span className="text-[11px] text-surface-600 font-medium">
            Model: RandomForest
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-accent-cyan" />
          <span className="text-[11px] text-surface-600 font-medium">
            LLM: Groq qwen/qwen3.8-27b
          </span>
        </div>
        <div className="mt-3 text-[10px] text-surface-700 leading-relaxed">
          AI Prompt Evaluator v1.0<br />
          &copy; 2024 ML Pipeline Project
        </div>
      </div>
    </aside>
  )
}
