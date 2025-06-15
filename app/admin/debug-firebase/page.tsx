"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { getMatches, getPlayerStatsForMatch } from "@/lib/playerStats"

export default function DebugFirebasePage() {
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any[]>([])

  const runDiagnostics = async () => {
    try {
      setLoading(true)
      setDebugInfo("Starting diagnostics...\n")

      // Get all matches
      const allMatches = await getMatches()
      setMatches(allMatches)

      setDebugInfo((prev) => prev + `Found ${allMatches.length} total matches\n`)

      // Look for Airport West vs East Keilor matches
      const airportWestMatches = allMatches.filter(
        (match) =>
          (match.homeTeam?.toLowerCase().includes("airport west") ||
            match.awayTeam?.toLowerCase().includes("airport west")) &&
          (match.homeTeam?.toLowerCase().includes("east keilor") ||
            match.awayTeam?.toLowerCase().includes("east keilor")),
      )

      setDebugInfo((prev) => prev + `Found ${airportWestMatches.length} Airport West vs East Keilor matches:\n`)

      airportWestMatches.forEach((match, index) => {
        setDebugInfo(
          (prev) =>
            prev +
            `  ${index + 1}. ${match.homeTeam} vs ${match.awayTeam} - Round ${match.round}, Season ${match.season}\n`,
        )
        setDebugInfo((prev) => prev + `     Match ID: ${match.id}\n`)
        setDebugInfo((prev) => prev + `     Has Stats: ${match.hasStats ? "YES" : "NO"}\n`)
        setDebugInfo((prev) => prev + `     Date: ${match.date}\n\n`)
      })

      // Check Round 1 specifically
      const round1Matches = allMatches.filter(
        (match) =>
          match.round?.toString() === "1" &&
          (match.homeTeam?.toLowerCase().includes("airport west") ||
            match.awayTeam?.toLowerCase().includes("airport west")) &&
          (match.homeTeam?.toLowerCase().includes("east keilor") ||
            match.awayTeam?.toLowerCase().includes("east keilor")),
      )

      setDebugInfo((prev) => prev + `Round 1 Airport West vs East Keilor matches: ${round1Matches.length}\n`)

      if (round1Matches.length > 0) {
        const match = round1Matches[0]
        setSelectedMatch(match)
        setDebugInfo((prev) => prev + `\nChecking stats for: ${match.homeTeam} vs ${match.awayTeam}\n`)

        try {
          const stats = await getPlayerStatsForMatch(match.id)
          setPlayerStats(stats)
          setDebugInfo((prev) => prev + `Found ${stats.length} player stat records\n`)

          if (stats.length > 0) {
            const teams = [...new Set(stats.map((s) => s.team))]
            setDebugInfo((prev) => prev + `Teams in stats: ${teams.join(", ")}\n`)

            teams.forEach((team) => {
              const teamStats = stats.filter((s) => s.team === team)
              setDebugInfo((prev) => prev + `  ${team}: ${teamStats.length} player records\n`)
            })

            // Check quarters
            const quarters = [...new Set(stats.map((s) => s.quarter))]
            setDebugInfo((prev) => prev + `Quarters available: ${quarters.join(", ")}\n`)
          } else {
            setDebugInfo((prev) => prev + `❌ NO PLAYER STATS FOUND for this match!\n`)
            setDebugInfo((prev) => prev + `This could mean:\n`)
            setDebugInfo((prev) => prev + `  - Stats weren't uploaded properly\n`)
            setDebugInfo((prev) => prev + `  - Wrong match ID in the stats\n`)
            setDebugInfo((prev) => prev + `  - Database permission issue\n`)
          }
        } catch (error) {
          setDebugInfo((prev) => prev + `❌ Error loading stats: ${error}\n`)
        }
      } else {
        setDebugInfo((prev) => prev + `❌ No Round 1 match found between Airport West and East Keilor\n`)
      }

      // Check all matches for stats
      setDebugInfo((prev) => prev + `\n=== ALL MATCHES SUMMARY ===\n`)
      const matchesWithStats = allMatches.filter((m) => m.hasStats)
      const matchesWithoutStats = allMatches.filter((m) => !m.hasStats)

      setDebugInfo((prev) => prev + `Matches with stats: ${matchesWithStats.length}\n`)
      setDebugInfo((prev) => prev + `Matches without stats: ${matchesWithoutStats.length}\n`)

      setDebugInfo((prev) => prev + `\nMatches WITH stats:\n`)
      matchesWithStats.forEach((match) => {
        setDebugInfo((prev) => prev + `  - ${match.homeTeam} vs ${match.awayTeam} (R${match.round}, ${match.season})\n`)
      })

      setDebugInfo((prev) => prev + `\nMatches WITHOUT stats:\n`)
      matchesWithoutStats.forEach((match) => {
        setDebugInfo((prev) => prev + `  - ${match.homeTeam} vs ${match.awayTeam} (R${match.round}, ${match.season})\n`)
      })
    } catch (error) {
      setDebugInfo((prev) => prev + `❌ Error during diagnostics: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Firebase Debug - Airport West vs East Keilor</h1>
            <p className="text-muted-foreground">Diagnose why stats aren't loading for specific matches</p>
          </div>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Run Diagnostics
              </>
            )}
          </Button>
        </div>

        {/* Debug Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Diagnostic Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
              {debugInfo || "Click 'Run Diagnostics' to start..."}
            </pre>
          </CardContent>
        </Card>

        {/* Selected Match Details */}
        {selectedMatch && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                Match Details: {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Match ID:</span>
                  <div className="text-xs text-gray-600 break-all">{selectedMatch.id}</div>
                </div>
                <div>
                  <span className="font-medium">Season:</span> {selectedMatch.season}
                </div>
                <div>
                  <span className="font-medium">Round:</span> {selectedMatch.round}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {selectedMatch.date}
                </div>
                <div>
                  <span className="font-medium">Has Stats:</span>
                  <Badge variant={selectedMatch.hasStats ? "default" : "destructive"} className="ml-2">
                    {selectedMatch.hasStats ? "YES" : "NO"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Player Stats Found:</span>
                  <Badge variant={playerStats.length > 0 ? "default" : "destructive"} className="ml-2">
                    {playerStats.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Stats Preview */}
        {playerStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Player Stats Preview (First 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {playerStats.slice(0, 10).map((stat, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{stat.playerName}</span>
                      <span className="text-gray-600 ml-2">({stat.team})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Q{stat.quarter}: {stat.fantasyPoints} FP
                    </div>
                  </div>
                ))}
                {playerStats.length > 10 && (
                  <div className="text-center text-gray-500 text-sm">... and {playerStats.length - 10} more</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Stats Warning */}
        {selectedMatch && playerStats.length === 0 && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="mr-2 h-5 w-5" />
                No Player Stats Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-red-700 space-y-2">
                <p>The match exists but has no player statistics. This could be because:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>The stats upload failed or was incomplete</li>
                  <li>The match ID in the uploaded stats doesn't match this match</li>
                  <li>The stats were uploaded to a different match</li>
                  <li>There was a database error during upload</li>
                </ul>
                <p className="mt-4">
                  <strong>Solution:</strong> Try re-uploading the stats for this match using the admin stats upload
                  page.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
