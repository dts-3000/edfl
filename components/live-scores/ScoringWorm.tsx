interface QuarterScore {
  goals: number
  behinds: number
  points: number
}

interface ScoringWormProps {
  homeTeam: string
  awayTeam: string
  homeQuarterScores: QuarterScore[]
  awayQuarterScores: QuarterScore[]
  currentQuarter: number
}

export function ScoringWorm({
  homeTeam,
  awayTeam,
  homeQuarterScores,
  awayQuarterScores,
  currentQuarter,
}: ScoringWormProps) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"]

  // Calculate cumulative scores
  const homeCumulative = homeQuarterScores.reduce((acc, quarter, index) => {
    const prevTotal = index > 0 ? acc[index - 1] : 0
    acc.push(prevTotal + quarter.points)
    return acc
  }, [] as number[])

  const awayCumulative = awayQuarterScores.reduce((acc, quarter, index) => {
    const prevTotal = index > 0 ? acc[index - 1] : 0
    acc.push(prevTotal + quarter.points)
    return acc
  }, [] as number[])

  const maxScore = Math.max(...homeCumulative, ...awayCumulative, 50) // Minimum scale of 50
  const chartHeight = 120

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm font-medium mb-3 text-center">Scoring Progression</div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            if (value <= maxScore) {
              const y = chartHeight - (value / maxScore) * chartHeight
              return (
                <g key={value}>
                  <line x1="0" y1={y} x2="100%" y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="0" y={y - 2} fontSize="10" fill="#6b7280" textAnchor="start">
                    {value}
                  </text>
                </g>
              )
            }
            return null
          })}

          {/* Home team line */}
          <polyline
            points={homeCumulative
              .map((score, index) => {
                const x = (index / 3) * 100
                const y = chartHeight - (score / maxScore) * chartHeight
                return `${x}%,${y}`
              })
              .join(" ")}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Away team line */}
          <polyline
            points={awayCumulative
              .map((score, index) => {
                const x = (index / 3) * 100
                const y = chartHeight - (score / maxScore) * chartHeight
                return `${x}%,${y}`
              })
              .join(" ")}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {homeCumulative.map((score, index) => {
            const x = (index / 3) * 100
            const y = chartHeight - (score / maxScore) * chartHeight
            return (
              <circle key={`home-${index}`} cx={`${x}%`} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
            )
          })}

          {awayCumulative.map((score, index) => {
            const x = (index / 3) * 100
            const y = chartHeight - (score / maxScore) * chartHeight
            return (
              <circle key={`away-${index}`} cx={`${x}%`} cy={y} r="4" fill="#ef4444" stroke="white" strokeWidth="2" />
            )
          })}
        </svg>

        {/* Quarter labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {quarters.map((quarter, index) => (
            <div key={quarter} className={`text-center ${index < currentQuarter ? "font-medium" : "text-gray-400"}`}>
              {quarter}
            </div>
          ))}
        </div>
      </div>

      {/* Legend and quarter scores */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="font-medium">{homeTeam}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{awayTeam}</span>
            <div className="w-3 h-3 bg-red-500 rounded"></div>
          </div>
        </div>

        {/* Quarter by quarter breakdown */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {quarters.map((quarter, index) => (
            <div key={quarter} className="text-center">
              <div className="font-medium text-gray-600">{quarter}</div>
              <div className="space-y-1">
                <div className="text-blue-600">
                  {homeQuarterScores[index]?.goals || 0}.{homeQuarterScores[index]?.behinds || 0} (
                  {homeQuarterScores[index]?.points || 0})
                </div>
                <div className="text-red-600">
                  {awayQuarterScores[index]?.goals || 0}.{awayQuarterScores[index]?.behinds || 0} (
                  {awayQuarterScores[index]?.points || 0})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
