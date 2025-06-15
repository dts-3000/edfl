"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { getMatches, getPlayerStatsForMatch } from "@/lib/playerStats"
import Navbar from "@/components/layout/Navbar"

interface DebugResult {
  step: string
  status: "success" | "error" | "warning"
  message: string
  data?: any
}

export default function DebugMatchPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DebugResult[]>([])

  const addResult = (step: string, status: "success" | "error" | "warning", message: string, data?: any) => {
    setResults((prev) => [...prev, { step, status, message, data }])
  }

  const debugAirportWestMatch = async () => {
    setLoading(true)
    setResults([])

    try {
      // Step 1: Get all matches
      addResult("1", "success", "Starting debug for Airport West vs East Keilor match...")

      const matches = await getMatches()
      addResult("2", "success", `Found ${matches.length} total matches`, { matchCount: matches.length })

      // Step 2: Find the specific match
      const airportWestMatch = matches.find(
        (m) =>
          (m.homeTeam === "Airport West" && m.awayTeam === "East Keilor") ||
          (m.homeTeam === "East Keilor" && m.awayTeam === "Airport West"),
      )

      if (!airportWestMatch) {
        addResult("3", "error", "Airport West vs East Keilor match not found!")
        return
      }

      addResult("3", "success", "Found Airport West vs East Keilor match", airportWestMatch)

      // Step 3: Get player stats for this match
      const playerStats = await getPlayerStatsForMatch(airportWestMatch.id)
      addResult("4", "success", `Found ${playerStats.length} player stats for this match`, {
        statsCount: playerStats.length,
        sampleStats: playerStats.slice(0, 3),
      })

      // Step 4: Analyze quarter formats
      const quarters = [...new Set(playerStats.map((s) => s.quarter))]
      addResult("5", "success", `Quarter formats found: ${quarters.join(", ")}`, { quarters })

      // Step 5: Check team distribution
      const teams = [...new Set(playerStats.map((s) => s.team))]
      const teamStats = teams.map((team) => ({
        team,
        playerCount: playerStats.filter((s) => s.team === team).length,
        quarters: [...new Set(playerStats.filter((s) => s.team === team).map((s) => s.quarter))],
      }))
      addResult("6", "success", `Teams found: ${teams.join(", ")}`, teamStats)

      // Step 6: Check for "All" quarter data
      const allQuarterStats = playerStats.filter((s) => s.quarter === "All")
      addResult(
        "7",
        allQuarterStats.length > 0 ? "success" : "warning",
        `Found ${allQuarterStats.length} "All" quarter stats`,
        { allQuarterCount: allQuarterStats.length, sampleAll: allQuarterStats.slice(0, 3) },
      )

      // Step 7: Check for individual quarter data
      const individualQuarters = playerStats.filter((s) => s.quarter !== "All")
      addResult(
        "8",
        individualQuarters.length > 0 ? "success" : "warning",
        `Found ${individualQuarters.length} individual quarter stats`,
        { individualQuarterCount: individualQuarters.length, sampleIndividual: individualQuarters.slice(0, 3) },
      )

      // Step 8: Check fantasy points distribution
      const fantasyPointsStats = playerStats.map((s) => s.fantasyPoints).sort((a, b) => b - a)
      addResult(
        "9",
        "success",
        `Fantasy points range: ${fantasyPointsStats[0]} (highest) to ${fantasyPointsStats[fantasyPointsStats.length - 1]} (lowest)`,
        {
          highest: fantasyPointsStats[0],
          lowest: fantasyPointsStats[fantasyPointsStats.length - 1],
          top5: fantasyPointsStats.slice(0, 5),
        },
      )

      // Step 9: Test the filtering logic
      const testQuarter = "All"
      const testTeam = "Airport West"
      const filteredStats = playerStats.filter((stat) => {
        if (stat.team !== testTeam) return false

        // Handle both quarter formats
        let normalizedQuarter = stat.quarter
        if (stat.quarter.toLowerCase() === "q1") normalizedQuarter = "1"
        if (stat.quarter.toLowerCase() === "q2") normalizedQuarter = "2"
        if (stat.quarter.toLowerCase() === "q3") normalizedQuarter = "3"
        if (stat.quarter.toLowerCase() === "q4") normalizedQuarter = "4"

        return normalizedQuarter === testQuarter
      })

      addResult(
        "10",
        "success",
        `Filtering test: Found ${filteredStats.length} stats for ${testTeam} in quarter "${testQuarter}"`,
        {
          filteredCount: filteredStats.length,
          filteredStats: filteredStats.slice(0, 3),
        },
      )
    } catch (error) {
      addResult("ERROR", "error", `Debug failed: ${error}`, { error })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Debug Airport West Match</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Match Debug Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={debugAirportWestMatch} disabled={loading} className="mb-4">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Debugging...
                </>
              ) : (
                "Debug Airport West vs East Keilor Match"
              )}
            </Button>

            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Debug Results:</h3>
                {results.map((result, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      result.status === "success"
                        ? "border-l-green-500"
                        : result.status === "error"
                          ? "border-l-red-500"
                          : "border-l-yellow-500"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Step {result.step}:</span>
                            <span
                              className={`text-sm ${
                                result.status === "success"
                                  ? "text-green-700"
                                  : result.status === "error"
                                    ? "text-red-700"
                                    : "text-yellow-700"
                              }`}
                            >
                              {result.message}
                            </span>
                          </div>
                          {result.data && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
