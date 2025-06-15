import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from "lucide-react"

interface SparklinePoint {
  value: number
  label: string
}

interface SparklineStatsProps {
  data: SparklinePoint[]
  title?: string
  height?: number
  lineColor?: string
  className?: string
}

export function SparklineStats({
  data,
  title = "Performance Trend",
  height = 40,
  lineColor = "#3b82f6",
  className = "",
}: SparklineStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <p className="text-gray-500 text-center">No data available</p>
      </div>
    )
  }

  // Calculate key stats
  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const maxRound = data.find((d) => d.value === max)?.label || ""
  const minRound = data.find((d) => d.value === min)?.label || ""
  const avg = Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1))

  // Calculate last 3 average
  const last3 = data.slice(-3)
  const last3Avg =
    last3.length > 0 ? Number((last3.reduce((sum, point) => sum + point.value, 0) / last3.length).toFixed(1)) : 0

  // Determine trend
  let trend: "up" | "down" | "stable" = "stable"
  if (last3Avg > avg + 5) {
    trend = "up"
  } else if (last3Avg < avg - 5) {
    trend = "down"
  }

  // Normalize values for sparkline (0 to 1 scale)
  const range = max - min || 1 // Avoid division by zero
  const normalizedValues = values.map((val) => (val - min) / range)

  // Generate sparkline path
  const width = 200 // Fixed width for the SVG
  const pathWidth = width - 4 // Padding on both sides
  const step = pathWidth / (normalizedValues.length - 1 || 1)

  let path = `M 2,${height - 2 - normalizedValues[0] * (height - 4)}`
  normalizedValues.forEach((val, i) => {
    if (i === 0) return // Skip first point as it's already in the initial M command
    path += ` L ${2 + i * step},${height - 2 - val * (height - 4)}`
  })

  return (
    <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
      <h3 className="text-lg font-medium mb-3">{title}</h3>

      <div className="mb-3">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {normalizedValues.map((val, i) => (
            <circle key={i} cx={2 + i * step} cy={height - 2 - val * (height - 4)} r="2" fill={lineColor} />
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Highest:</span>
          <span className="ml-1 font-medium">
            {max} ({maxRound})
          </span>
        </div>
        <div>
          <span className="text-gray-600">Lowest:</span>
          <span className="ml-1 font-medium">
            {min} ({minRound})
          </span>
        </div>
        <div>
          <span className="text-gray-600">Last 3 Avg:</span>
          <span className="ml-1 font-medium">{last3Avg}</span>
        </div>
        <div>
          <span className="text-gray-600">Season Avg:</span>
          <span className="ml-1 font-medium">{avg}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-600">Trend:</span>
          <span className="ml-1 font-medium flex items-center">
            {trend === "up" ? (
              <>
                <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" /> Improving
              </>
            ) : trend === "down" ? (
              <>
                <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" /> Declining
              </>
            ) : (
              <>
                <ArrowRightIcon className="h-4 w-4 text-gray-600 mr-1" /> Stable
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
