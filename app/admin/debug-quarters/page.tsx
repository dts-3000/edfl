"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPlayerStatsForMatch } from "@/lib/playerStats"
import { Badge } from "@/components/ui/badge"

export default function DebugQuartersPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const debugQuarters = async () => {
    setLoading(true)
    try {
      // Debug the Airport West vs East Keilor match
      const matchId = "2025-r1-airportwest-vs-eastkeilor"
      const stats = await getPlayerStatsForMatch(matchId)

      // Analyze quarter data
      const quarters = [...new Set(stats.map((stat) => stat.quarter))].sort()
      const quarterCounts = quarters.map((q) => ({
        quarter: q,
        count: stats.filter((stat) => stat.quarter === q).length,
      }))

      // Check for individual quarter data
      const individualQuarters = quarters.filter(
        (q) => q !== "All" && q !== "Total" && ["1", "2", "3", "4", "Q1", "Q2", "Q3", "Q4"].includes(q),
      )

      // Sample player breakdown
      const samplePlayer = "Cooper McMullin"
      const playerStats = stats.filter((stat) => stat.playerName === samplePlayer)

      // Check if hasQuarterData would return true
      const hasQuarterData = quarters.some((q) => q !== "All" && ["1", "2", "3", "4"].includes(q))

      setResults({
        totalStats: stats.length,
        quarters,
        quarterCounts,
        individualQuarters,
        hasQuarterData,
        samplePlayer: {
          name: samplePlayer,
          stats: playerStats,
        },
        quarterFormats: {
          hasQ1Format: quarters.some((q) => q.toLowerCase().startsWith("q")),
          hasNumberFormat: quarters.some((q) => ["1", "2", "3", "4"].includes(q)),
          hasTotal: quarters.includes("Total"),
          hasAll: quarters.includes("All"),
        },
      })
    } catch (error) {
      console.error("Debug error:", error)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Quarter Data Debug</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Quarter-by-Quarter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={debugQuarters} disabled={loading}>
            {loading ? "Debugging..." : "Debug Airport West vs East Keilor Quarters"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          {results.error ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-red-600">Error: {results.error}</div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Quarter Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <strong>Total Stats Found:</strong> {results.totalStats}
                    </div>

                    <div>
                      <strong>Available Quarters:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {results.quarters.map((q) => (
                          <Badge key={q} variant="outline">
                            {q}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong>Quarter Counts:</strong>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {results.quarterCounts.map((qc) => (
                          <div key={qc.quarter} className="p-2 border rounded">
                            <div className="font-medium">{qc.quarter}</div>
                            <div className="text-sm text-gray-600">{qc.count} records</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong>Individual Quarters Found:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {results.individualQuarters.map((q) => (
                          <Badge key={q} variant="secondary">
                            {q}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong>hasQuarterData() would return:</strong>
                      <Badge variant={results.hasQuarterData ? "default" : "destructive"}>
                        {results.hasQuarterData ? "TRUE" : "FALSE"}
                      </Badge>
                    </div>

                    <div>
                      <strong>Quarter Formats:</strong>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          Q1-Q4 Format:{" "}
                          <Badge variant={results.quarterFormats.hasQ1Format ? "default" : "secondary"}>
                            {results.quarterFormats.hasQ1Format ? "YES" : "NO"}
                          </Badge>
                        </div>
                        <div>
                          1-4 Format:{" "}
                          <Badge variant={results.quarterFormats.hasNumberFormat ? "default" : "secondary"}>
                            {results.quarterFormats.hasNumberFormat ? "YES" : "NO"}
                          </Badge>
                        </div>
                        <div>
                          Has "Total":{" "}
                          <Badge variant={results.quarterFormats.hasTotal ? "default" : "secondary"}>
                            {results.quarterFormats.hasTotal ? "YES" : "NO"}
                          </Badge>
                        </div>
                        <div>
                          Has "All":{" "}
                          <Badge variant={results.quarterFormats.hasAll ? "default" : "secondary"}>
                            {results.quarterFormats.hasAll ? "YES" : "NO"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Player: {results.samplePlayer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.samplePlayer.stats.map((stat, index) => (
                      <div key={index} className="p-2 border rounded">
                        <div>
                          <strong>Quarter:</strong> {stat.quarter}
                        </div>
                        <div>
                          <strong>Fantasy Points:</strong> {stat.fantasyPoints}
                        </div>
                        <div>
                          <strong>Goals:</strong> {stat.goals}, <strong>Kicks:</strong> {stat.kicks},{" "}
                          <strong>Handballs:</strong> {stat.handballs}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
