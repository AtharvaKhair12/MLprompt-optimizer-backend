import React, { useMemo } from 'react'

/**
 * Animated circular gauge showing the quality score from 0-10.
 * Uses SVG stroke-dashoffset for a smooth fill animation.
 */
export default function ScoreGauge({ score }) {
  const RADIUS = 42
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ~263.9
  const pct = Math.min(Math.max(score / 10, 0), 1)
  const dashOffset = CIRCUMFERENCE * (1 - pct)

  const strokeColor = useMemo(() => {
    if (score >= 8.5) return '#4ade80'   // green
    if (score >= 7.0) return '#818cf8'   // brand purple
    if (score >= 5.0) return '#fbbf24'   // amber
    if (score >= 3.0) return '#fb923c'   // orange
    return '#f87171'                      // red
  }, [score])

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg
        className="-rotate-90"
        width="96"
        height="96"
        viewBox="0 0 96 96"
      >
        {/* Track */}
        <circle
          cx="48" cy="48"
          r={RADIUS}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />
        {/* Fill */}
        <circle
          cx="48" cy="48"
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out, stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${strokeColor}88)`,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-surface-50 leading-none">
          {score.toFixed(1)}
        </span>
        <span className="text-[9px] text-surface-600 font-medium mt-0.5 uppercase tracking-wider">
          Score
        </span>
      </div>
    </div>
  )
}
