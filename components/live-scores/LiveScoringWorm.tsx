interface ScoringEvent {
  time: number // Time in seconds from start of game
  quarter: number
  quarterTime: number
  homeScore: number
  awayScore: number
  scoringTeam?: "home" | "away"
  scoringType?: "goal" | "behind"
  player?: string
}

interface LiveScoringWormProps {
  homeTeam: string
  awayTeam: string
  scoringEvents: ScoringEvent[]
  currentQuarter: number
  currentQuarterTime: number
  isLive?: boolean
}

export function LiveScoringWorm({
  homeTeam,
  awayTeam,
  scoringEvents,
  currentQuarter,
  currentQuarterTime,
  isLive = false,
}: LiveScoringWormProps) {
  const chartHeight = 120
  const chartWidth = 100 // percentage

  // Calculate current game time in seconds
  const getCurrentGameTime = () => {
    const quarterLength = 20 * 60 // 20 minutes per quarter in seconds
    return (currentQuarter - 1) * quarterLength + currentQuarterTime
  }

  // Add current position if live
  const allEvents = [...scoringEvents]
  if (isLive && scoringEvents.length > 0) {
    const currentTime = getCurrentGameTime()
    const lastEvent = scoringEvents[scoringEvents.length - 1]

    // Add current position with last known scores
    allEvents.push({
      time: currentTime,
      quarter: currentQuarter,
      quarterTime: currentQuarterTime,
      homeScore: lastEvent.homeScore,
      awayScore: lastEvent.awayScore,
    })
  }

  // Calculate score differences (margin)
  const margins = allEvents.map((event) => event.homeScore - event.awayScore)
  const maxMargin = Math.max(...margins.map(Math.abs), 20) // Minimum scale of 20 points

  // Calculate time range
  const maxTime = Math.max(...allEvents.map((e) => e.time), getCurrentGameTime())
  const timeRange = Math.max(maxTime, 20 * 60) // Minimum 20 minutes

  // Generate path for the worm
  const generatePath = () => {
    if (allEvents.length === 0) return ""

    return allEvents
      .map((event, index) => {
        const x = (event.time / timeRange) * chartWidth
        const y = chartHeight / 2 - (margins[index] / maxMargin) * (chartHeight / 2 - 10)
        return `${index === 0 ? "M" : "L"} ${x}% ${y}`
      })
      .join(" ")
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get quarter markers
  const getQuarterMarkers = () => {
    const quarterLength = 20 * 60
    return [1, 2, 3, 4].map((q) => ({
      quarter: q,
      time: (q - 1) * quarterLength,
      x: (((q - 1) * quarterLength) / timeRange) * chartWidth,
    }))
  }

  const quarterMarkers = getQuarterMarkers()
  const currentGameTime = getCurrentGameTime()
  const currentX = (currentGameTime / timeRange) * chartWidth

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium">Live Scoring Progression</div>
        {isLive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-600 font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Grid lines for score margins */}
          {[-maxMargin, -maxMargin / 2, 0, maxMargin / 2, maxMargin].map((margin) => {
            const y = chartHeight / 2 - (margin / maxMargin) * (chartHeight / 2 - 10)
            return (
              <g key={margin}>
                <line
                  x1="0"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke={margin === 0 ? "#6b7280" : "#e5e7eb"}
                  strokeWidth={margin === 0 ? "2" : "1"}
                  strokeDasharray={margin === 0 ? "none" : "2,2"}
                />
                <text x="2" y={y - 2} fontSize="10" fill="#6b7280" textAnchor="start">
                  {margin > 0 ? `+${margin}` : margin === 0 ? "0" : margin}
                </text>
              </g>
            )
          })}

          {/* Quarter divider lines */}
          {quarterMarkers.slice(1).map((marker) => (
            <line
              key={marker.quarter}
              x1={`${marker.x}%`}
              y1="0"
              x2={`${marker.x}%`}
              y2={chartHeight}
              stroke="#d1d5db"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {/* Scoring worm line */}
          {allEvents.length > 1 && (
            <path
              d={generatePath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current position indicator (if live) */}
          {isLive && (
            <line
              x1={`${currentX}%`}
              y1="0"
              x2={`${currentX}%`}
              y2={chartHeight}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="none"
            />
          )}

          {/* Scoring event markers */}
          {allEvents.map((event, index) => {
            if (!event.scoringTeam) return null

            const x = (event.time / timeRange) * chartWidth
            const y = chartHeight / 2 - (margins[index] / maxMargin) * (chartHeight / 2 - 10)
            const isGoal = event.scoringType === "goal"

            return (
              <g key={index}>
                <circle
                  cx={`${x}%`}
                  cy={y}
                  r={isGoal ? "6" : "4"}
                  fill={event.scoringTeam === "home" ? "#3b82f6" : "#ef4444"}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer"
                >
                  <title>
                    {isGoal ? "Goal" : "Behind"} - {event.player || "Unknown"}
                    {"\n"}Q{event.quarter} {formatTime(event.quarterTime)}
                    {"\n"}
                    {event.scoringTeam === "home" ? homeTeam : awayTeam}
                  </title>
                </circle>
                {isGoal && (
                  <text x={`${x}%`} y={y + 2} fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">
                    G
                    <title>
                      Goal - {event.player || "Unknown"}
                      {"\n"}Q{event.quarter} {formatTime(event.quarterTime)}
                      {"\n"}
                      {event.scoringTeam === "home" ? homeTeam : awayTeam}
                    </title>
                  </text>
                )}
              </g>
            )
          })}

          {/* Current time marker (if live) */}
          {isLive && (
            <circle
              cx={`${currentX}%`}
              cy={chartHeight / 2 - (margins[margins.length - 1] / maxMargin) * (chartHeight / 2 - 10)}
              r="5"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Time labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {quarterMarkers.map((marker) => (
            <div
              key={marker.quarter}
              className={`text-center ${marker.quarter <= currentQuarter ? "font-medium" : "text-gray-400"}`}
            >
              Q{marker.quarter}
            </div>
          ))}
          {isLive && <div className="text-red-600 font-medium text-right">{formatTime(currentGameTime)}</div>}
        </div>
      </div>

      {/* Legend and current scores */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="font-medium">{homeTeam}</span>
            {allEvents.length > 0 && (
              <span className="text-lg font-bold">{allEvents[allEvents.length - 1].homeScore}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {allEvents.length > 0 && (
              <span className="text-lg font-bold">{allEvents[allEvents.length - 1].awayScore}</span>
            )}
            <span className="font-medium">{awayTeam}</span>
            <div className="w-3 h-3 bg-red-500 rounded"></div>
          </div>
        </div>

        {/* Current margin */}
        {allEvents.length > 0 && (
          <div className="text-center text-sm">
            <span className="text-gray-600">Margin: </span>
            <span className="font-medium">
              {margins[margins.length - 1] === 0
                ? "Tied"
                : `${Math.abs(margins[margins.length - 1])} pts to ${
                    margins[margins.length - 1] > 0 ? homeTeam : awayTeam
                  }`}
            </span>
          </div>
        )}

        {/* Recent scoring events */}
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Recent Scores:</div>
          <div className="max-h-16 overflow-y-auto space-y-1">
            {allEvents
              .filter((e) => e.scoringTeam)
              .slice(-3)
              .reverse()
              .map((event, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {formatTime(event.time)} Q{event.quarter}
                  </span>
                  <span className={event.scoringTeam === "home" ? "text-blue-600" : "text-red-600"}>
                    {event.player} ({event.scoringType === "goal" ? "Goal" : "Behind"})
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
