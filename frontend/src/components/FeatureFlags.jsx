import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

const FLAGS = [
  { key: 'has_role',          label: 'Role Defined',       tip: 'e.g., "You are a senior engineer…"' },
  { key: 'has_task_kw',       label: 'Task Keyword',        tip: 'e.g., task, objective, provide, create' },
  { key: 'has_format_kw',     label: 'Format Specified',    tip: 'e.g., markdown, JSON, summary' },
  { key: 'has_context_kw',    label: 'Context Provided',    tip: 'e.g., context, background, given' },
  { key: 'has_constraint_kw', label: 'Constraints Set',     tip: 'e.g., under 500 words, using Python' },
]

export default function FeatureFlags({ evaluation }) {
  return (
    <div className="p-4 glass rounded-2xl space-y-2.5">
      <p className="text-[10px] uppercase tracking-widest text-surface-600 font-semibold mb-3">
        Prompt Feature Analysis
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pb-3 border-b border-surface-700">
        {[
          { label: 'Words',     value: evaluation.word_count },
          { label: 'Chars',     value: evaluation.char_count },
          { label: 'Sentences', value: evaluation.sentence_count },
        ].map(({ label, value }) => (
          <div key={label} className="text-center p-2 rounded-lg bg-surface-900">
            <p className="text-sm font-bold text-surface-100">{value}</p>
            <p className="text-[10px] text-surface-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Feature flags */}
      {FLAGS.map(({ key, label, tip }) => {
        const isPresent = evaluation[key]
        return (
          <div
            key={key}
            className={`
              flex items-center gap-3 p-2 rounded-lg transition-colors
              ${isPresent ? 'bg-accent-green/5' : 'bg-surface-900/50'}
            `}
            title={tip}
          >
            {isPresent
              ? <CheckCircle2 size={15} className="text-accent-green flex-shrink-0" />
              : <XCircle     size={15} className="text-surface-700 flex-shrink-0" />
            }
            <span className={`text-sm ${isPresent ? 'text-surface-200' : 'text-surface-600'}`}>
              {label}
            </span>
            {!isPresent && (
              <span className="ml-auto text-[10px] text-surface-700 italic">{tip}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
