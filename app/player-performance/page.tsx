"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Download, Users, User, AlertCircle } from "lucide-react"

interface PlayerStat {
  id: string
  playerName: string
  team: string
  matchId: string
  season: number
  round: number
  fantasyPoints: number
  goals: number
  behinds: number
  kicks: number
  handballs: number
  marks: number
  tackles: number
  hitOuts: number
  quarter: string
  createdAt: any
  playerId?: string
}

interface PlayerPerformance {
  playerName: string
  team: string
  games: PlayerStat[]
  totalGames: number
  averageScore: number
  highestScore: number
  lowestScore: number
  totalPoints: number
  trend: "up" | "down" | "stable"
}

export default function PlayerPerformancePage() {
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [playerPerformance, setPlayerPerformance] = useState<PlayerPerformance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<string[]>([])
  const [teamPlayers, setTeamPlayers] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      loadTeamPlayers(selectedTeam)
      setSelectedPlayer("")
      setPlayerPerformance(null)
    }
  }, [selectedTeam])

  useEffect(() => {
    if (selectedTeam && selectedPlayer) {
      loadPlayerPerformance(selectedPlayer, selectedTeam)
    }
  }, [selectedPlayer, selectedTeam])

  const loadTeams = async () => {
    try {
      setDebugInfo("Loading teams...")
      const statsRef = collection(db, "playerStats")
      const snapshot = await getDocs(statsRef)

      const teamNames = new Set<string>()
      let totalRecords = 0

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        totalRecords++
        if (data.team && typeof data.team === "string") {
          teamNames.add(data.team)
        }
      })

      setDebugInfo(`Found ${totalRecords} total records, ${teamNames.size} unique teams`)
      setTeams(Array.from(teamNames).sort())
    } catch (err) {
      console.error("Error loading teams:", err)
      setDebugInfo(`Error loading teams: ${err}`)
    }
  }

  const loadTeamPlayers = async (team: string) => {
    try {
      setDebugInfo(`Loading players for ${team}...`)
      const statsRef = collection(db, "playerStats")
      const q = query(statsRef, where("team", "==", team))
      const snapshot = await getDocs(q)

      const playerNames = new Set<string>()
      let teamRecords = 0

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        teamRecords++
        if (data.playerName && typeof data.playerName === "string") {
          playerNames.add(data.playerName)
        }
      })

      setDebugInfo(`Found ${teamRecords} records for ${team}, ${playerNames.size} unique players`)
      setTeamPlayers(Array.from(playerNames).sort())
    } catch (err) {
      console.error("Error loading team players:", err)
      setDebugInfo(`Error loading players: ${err}`)
    }
  }

  const loadPlayerPerformance = async (playerName: string, team: string) => {
    setLoading(true)
    setError(null)

    try {
      setDebugInfo(`Loading performance for ${playerName} at ${team}...`)

      const statsRef = collection(db, "playerStats")

      // Try different query approaches
      let snapshot
      let queryInfo = ""

      try {
        // First try with both filters
        const q1 = query(statsRef, where("playerName", "==", playerName), where("team", "==", team))
        snapshot = await getDocs(q1)
        queryInfo = `Query with both filters: ${snapshot.docs.length} results`
      } catch (err) {
        setDebugInfo(`Error with compound query: ${err}`)

        // Fallback: query by player name only
        const q2 = query(statsRef, where("playerName", "==", playerName))
        snapshot = await getDocs(q2)
        queryInfo = `Query by player name only: ${snapshot.docs.length} results`
      }

      const games: PlayerStat[] = []
      const quarterTypes = new Set<string>()

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as PlayerStat
        quarterTypes.add(data.quarter || "unknown")

        // Filter by team if we had to use fallback query
        if (data.team === team) {
          games.push({ ...data, id: doc.id, playerId: data.playerId })
        }
      })

      setDebugInfo(
        `${queryInfo}. Quarter types: ${Array.from(quarterTypes).join(", ")}. Games for team: ${games.length}`,
      )

      if (games.length === 0) {
        setError(`No games found for ${playerName} at ${team}. ${queryInfo}`)
        setPlayerPerformance(null)
        return
      }

      // Filter for full game stats (not individual quarters)
      const fullGameStats = games.filter(
        (game) =>
          game.quarter === "Total" || game.quarter === "All" || game.quarter === "total" || game.quarter === "all",
      )

      if (fullGameStats.length === 0) {
        setError(`Found ${games.length} records but no full game stats (Total/All quarters) for ${playerName}`)
        setPlayerPerformance(null)
        return
      }

      // Sort by season and round
      fullGameStats.sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season
        return a.round - b.round
      })

      const totalPoints = fullGameStats.reduce((sum, game) => sum + (game.fantasyPoints || 0), 0)
      const averageScore = totalPoints / fullGameStats.length
      const scores = fullGameStats.map((g) => g.fantasyPoints || 0)
      const highestScore = Math.max(...scores)
      const lowestScore = Math.min(...scores)

      // Calculate trend (last 3 games vs previous 3 games)
      let trend: "up" | "down" | "stable" = "stable"
      if (fullGameStats.length >= 6) {
        const recent3 = fullGameStats.slice(-3).reduce((sum, g) => sum + (g.fantasyPoints || 0), 0) / 3
        const previous3 = fullGameStats.slice(-6, -3).reduce((sum, g) => sum + (g.fantasyPoints || 0), 0) / 3
        if (recent3 > previous3 + 5) trend = "up"
        else if (recent3 < previous3 - 5) trend = "down"
      }

      setPlayerPerformance({
        playerName,
        team,
        games: fullGameStats,
        totalGames: fullGameStats.length,
        averageScore,
        highestScore,
        lowestScore,
        totalPoints,
        trend,
      })

      setDebugInfo(`Successfully loaded ${fullGameStats.length} games for ${playerName}`)
    } catch (err) {
      console.error("Error loading player performance:", err)
      setError(`Error loading player data: ${err}`)
      setDebugInfo(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!playerPerformance) return

    const headers = [
      "Player Name",
      "PlayerID",
      "Season",
      "Round",
      "Team",
      "Fantasy Points",
      "Goals",
      "Behinds",
      "Kicks",
      "Handballs",
      "Marks",
      "Tackles",
      "Hit Outs",
    ]
    const rows = playerPerformance.games.map((game) => [
      game.playerName,
      game.playerId,
      game.season,
      game.round,
      game.team,
      game.fantasyPoints || 0,
      game.goals || 0,
      game.behinds || 0,
      game.kicks || 0,
      game.handballs || 0,
      game.marks || 0,
      game.tackles || 0,
      game.hitOuts || 0,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${playerPerformance.playerName}_${playerPerformance.team}_performance.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Player Performance Tracker</h1>
        <p className="text-gray-600">Track any player's performance across all games and seasons</p>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">{debugInfo}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team and Player Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Team & Player
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Player</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer} disabled={!selectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedTeam ? "Choose a player..." : "Select team first"} />
                </SelectTrigger>
                <SelectContent>
                  {teamPlayers.map((player) => (
                    <SelectItem key={player} value={player}>
                      {player}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTeam && (
            <div className="mt-4 text-sm text-gray-600">
              <strong>{teamPlayers.length}</strong> players available for {selectedTeam}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading player performance data...</p>
          </CardContent>
        </Card>
      )}

      {/* Player Performance Results */}
      {playerPerformance && !loading && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {playerPerformance.playerName} ({playerPerformance.team}) - Performance Summary
                {playerPerformance.trend === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
                {playerPerformance.trend === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
              </CardTitle>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{playerPerformance.totalGames}</div>
                  <div className="text-sm text-gray-600">Games Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{playerPerformance.averageScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{playerPerformance.highestScore}</div>
                  <div className="text-sm text-gray-600">Highest Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{playerPerformance.lowestScore}</div>
                  <div className="text-sm text-gray-600">Lowest Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{playerPerformance.totalPoints}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
              </div>

              {/* Performance Trend Indicator */}
              <div className="mt-6 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium">Recent Form:</span>
                  {playerPerformance.trend === "up" && (
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      Improving
                    </span>
                  )}
                  {playerPerformance.trend === "down" && (
                    <span className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      Declining
                    </span>
                  )}
                  {playerPerformance.trend === "stable" && <span className="text-gray-600">Stable</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game by Game Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Game by Game Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player Name</th>
                      <th className="text-left p-2">Season</th>
                      <th className="text-left p-2">Round</th>
                      <th className="text-right p-2">Fantasy Points</th>
                      <th className="text-right p-2">Goals</th>
                      <th className="text-right p-2">Behinds</th>
                      <th className="text-right p-2">Marks</th>
                      <th className="text-right p-2">Tackles</th>
                      <th className="text-right p-2">Disposals</th>
                      <th className="text-right p-2">Hit Outs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerPerformance.games.map((game, index) => (
                      <tr key={game.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{game.playerName}</td>
                        <td className="p-2">{game.season}</td>
                        <td className="p-2">R{game.round}</td>
                        <td className="p-2 text-right font-semibold">{game.fantasyPoints || 0}</td>
                        <td className="p-2 text-right">{game.goals || 0}</td>
                        <td className="p-2 text-right">{game.behinds || 0}</td>
                        <td className="p-2 text-right">{game.marks || 0}</td>
                        <td className="p-2 text-right">{game.tackles || 0}</td>
                        <td className="p-2 text-right">{(game.kicks || 0) + (game.handballs || 0)}</td>
                        <td className="p-2 text-right">{game.hitOuts || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      {!selectedTeam && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>• First select a team from the dropdown</li>
              <li>• Then choose a player from that team</li>
              <li>• View their complete game history and statistics</li>
              <li>• See performance trends and averages</li>
              <li>• Export data to CSV for further analysis</li>
              <li>• Track improvement over time</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
