"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMatches, getPlayerStatsForMatch, type PlayerStat } from "@/lib/playerStats"
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AwardIcon,
  BarChart4Icon,
} from "lucide-react"

// Types
interface MatchData {
  id: string
  season: string
  round: string
  homeTeam: string
  awayTeam: string
  date: string
  hasStats: boolean
}

interface QuarterStats {
  q1: number
  q2: number
  q3: number
  q4: number
  total: number
}

interface PlayerQuarterData {
  id: string
  name: string
  team: string
  position?: string
  quarters: QuarterStats
  consistency: number
  trend: "up" | "down" | "flat"
}

export default function PlayerStatsPage() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string>("")
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [teamFilter, setTeamFilter] = useState("All Teams")

  // Load matches
  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true)
        const matchData = await getMatches()
        // Filter to only matches with stats
        const matchesWithStats = matchData.filter((match) => match.hasStats)
        setMatches(matchesWithStats)

        // Select the most recent match by default
        if (matchesWithStats.length > 0) {
          setSelectedMatch(matchesWithStats[0].id)
        }
      } catch (err) {
        console.error("Error loading matches:", err)
        setError("Failed to load match data")
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [])

  // Load player stats when match selection changes
  useEffect(() => {
    async function loadPlayerStats() {
      if (!selectedMatch) return

      try {
        setLoading(true)
        const stats = await getPlayerStatsForMatch(selectedMatch)
        setPlayerStats(stats)
      } catch (err) {
        console.error("Error loading player stats:", err)
        setError("Failed to load player statistics")
      } finally {
        setLoading(false)
      }
    }

    loadPlayerStats()
  }, [selectedMatch])

  // Process player stats by quarter
  const playerQuarterData = useMemo(() => {
    const playerMap = new Map<string, PlayerQuarterData>()

    // First pass: collect all player data
    playerStats.forEach((stat) => {
      if (stat.quarter === "All") return // Skip "All" quarter entries

      const playerId = stat.playerId || `${stat.playerName}-${stat.team}`

      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          id: playerId,
          name: stat.playerName,
          team: stat.team,
          quarters: { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 },
          consistency: 0,
          trend: "flat",
        })
      }

      const player = playerMap.get(playerId)!

      // Update quarter stats
      if (stat.quarter === "1") player.quarters.q1 = stat.fantasyPoints
      if (stat.quarter === "2") player.quarters.q2 = stat.fantasyPoints
      if (stat.quarter === "3") player.quarters.q3 = stat.fantasyPoints
      if (stat.quarter === "4") player.quarters.q4 = stat.fantasyPoints
    })

    // Second pass: calculate totals, consistency, and trends
    playerMap.forEach((player) => {
      // Calculate total
      player.quarters.total = player.quarters.q1 + player.quarters.q2 + player.quarters.q3 + player.quarters.q4

      // Calculate consistency (standard deviation)
      const quarters = [player.quarters.q1, player.quarters.q2, player.quarters.q3, player.quarters.q4].filter(
        (q) => q > 0,
      )
      if (quarters.length > 1) {
        const mean = quarters.reduce((sum, q) => sum + q, 0) / quarters.length
        const variance = quarters.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quarters.length
        player.consistency = Math.sqrt(variance)
      }

      // Calculate trend
      if (quarters.length >= 3) {
        const firstHalf = (player.quarters.q1 + player.quarters.q2) / 2
        const secondHalf = (player.quarters.q3 + player.quarters.q4) / 2

        if (secondHalf > firstHalf * 1.2) player.trend = "up"
        else if (secondHalf < firstHalf * 0.8) player.trend = "down"
        else player.trend = "flat"
      }
    })

    return Array.from(playerMap.values())
  }, [playerStats])

  // Filter by team
  const filteredPlayers = useMemo(() => {
    if (teamFilter === "All Teams") return playerQuarterData
    return playerQuarterData.filter((player) => player.team === teamFilter)
  }, [playerQuarterData, teamFilter])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (filteredPlayers.length === 0) {
      return {
        bestQuarterPlayer: null,
        bestQuarterScore: 0,
        bestQuarter: 0,
        mostConsistentPlayer: null,
        bestConsistency: Number.POSITIVE_INFINITY,
        bestFinalQuarterPlayer: null,
        bestFinalQuarterScore: 0,
        bestTrendPlayer: null,
      }
    }

    let bestQuarterPlayer = filteredPlayers[0]
    let bestQuarterScore = 0
    let bestQuarter = 0

    let mostConsistentPlayer = filteredPlayers[0]
    let bestConsistency = Number.POSITIVE_INFINITY

    let bestFinalQuarterPlayer = filteredPlayers[0]
    let bestFinalQuarterScore = 0

    const bestTrendPlayer = filteredPlayers.find((p) => p.trend === "up") || filteredPlayers[0]

    filteredPlayers.forEach((player) => {
      // Find best quarter performance
      const quarters = [
        { num: 1, score: player.quarters.q1 },
        { num: 2, score: player.quarters.q2 },
        { num: 3, score: player.quarters.q3 },
        { num: 4, score: player.quarters.q4 },
      ]

      const bestPlayerQuarter = quarters.reduce(
        (best, current) => (current.score > best.score ? current : best),
        quarters[0],
      )

      if (bestPlayerQuarter.score > bestQuarterScore) {
        bestQuarterPlayer = player
        bestQuarterScore = bestPlayerQuarter.score
        bestQuarter = bestPlayerQuarter.num
      }

      // Find most consistent player (lowest standard deviation)
      if (player.consistency < bestConsistency && player.quarters.total > 0) {
        mostConsistentPlayer = player
        bestConsistency = player.consistency
      }

      // Find best final quarter performer
      if (player.quarters.q4 > bestFinalQuarterScore) {
        bestFinalQuarterPlayer = player
        bestFinalQuarterScore = player.quarters.q4
      }
    })

    return {
      bestQuarterPlayer,
      bestQuarterScore,
      bestQuarter,
      mostConsistentPlayer,
      bestConsistency,
      bestFinalQuarterPlayer,
      bestFinalQuarterScore,
      bestTrendPlayer,
    }
  }, [filteredPlayers])

  // Get unique teams for filter
  const teams = useMemo(() => {
    const teamSet = new Set<string>()
    playerQuarterData.forEach((player) => teamSet.add(player.team))
    return ["All Teams", ...Array.from(teamSet).sort()]
  }, [playerQuarterData])

  // Get selected match details
  const selectedMatchDetails = useMemo(() => {
    return matches.find((match) => match.id === selectedMatch)
  }, [matches, selectedMatch])

  if (loading && matches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading match data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Match Data Available</h1>
          <p className="text-gray-600">No matches with player statistics were found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quarter-by-Quarter Analysis</h1>
        <p className="text-gray-600">Detailed breakdown of player performance across all quarters</p>
      </div>

      {/* Match Selector */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Match</label>
            <Select value={selectedMatch} onValueChange={setSelectedMatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select a match" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((match) => (
                  <SelectItem key={match.id} value={match.id}>
                    {match.season} R{match.round}: {match.homeTeam} vs {match.awayTeam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Team</label>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
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

          {loading && (
            <div className="flex items-center mt-4 md:mt-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Loading stats...</span>
            </div>
          )}
        </div>

        {selectedMatchDetails && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedMatchDetails.date} at {selectedMatchDetails.venue || "Unknown Venue"}
          </div>
        )}
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Best Quarter Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryStats.bestQuarterPlayer ? (
              <>
                <div className="text-2xl font-bold text-blue-900">
                  {summaryStats.bestQuarterScore} pts <span className="text-lg">(Q{summaryStats.bestQuarter})</span>
                </div>
                <div className="text-sm font-medium mt-1 flex items-center">
                  <AwardIcon className="h-4 w-4 mr-1 text-blue-700" />
                  {summaryStats.bestQuarterPlayer.name} ({summaryStats.bestQuarterPlayer.team})
                </div>
              </>
            ) : (
              <div className="text-lg text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Most Consistent Player</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryStats.mostConsistentPlayer ? (
              <>
                <div className="text-2xl font-bold text-green-900">
                  {summaryStats.bestConsistency.toFixed(1)} <span className="text-lg">variance</span>
                </div>
                <div className="text-sm font-medium mt-1 flex items-center">
                  <BarChart4Icon className="h-4 w-4 mr-1 text-green-700" />
                  {summaryStats.mostConsistentPlayer.name} ({summaryStats.mostConsistentPlayer.team})
                </div>
              </>
            ) : (
              <div className="text-lg text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Best Final Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryStats.bestFinalQuarterPlayer ? (
              <>
                <div className="text-2xl font-bold text-purple-900">
                  {summaryStats.bestFinalQuarterScore} pts <span className="text-lg">(Q4)</span>
                </div>
                <div className="text-sm font-medium mt-1 flex items-center">
                  <AwardIcon className="h-4 w-4 mr-1 text-purple-700" />
                  {summaryStats.bestFinalQuarterPlayer.name} ({summaryStats.bestFinalQuarterPlayer.team})
                </div>
              </>
            ) : (
              <div className="text-lg text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Strongest Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryStats.bestTrendPlayer ? (
              <>
                <div className="text-2xl font-bold text-amber-900 flex items-center">
                  {summaryStats.bestTrendPlayer.trend === "up" ? (
                    <>
                      <TrendingUpIcon className="h-6 w-6 mr-1 text-green-600" />
                      <span>Improving</span>
                    </>
                  ) : summaryStats.bestTrendPlayer.trend === "down" ? (
                    <>
                      <TrendingDownIcon className="h-6 w-6 mr-1 text-red-600" />
                      <span>Declining</span>
                    </>
                  ) : (
                    <>
                      <MinusIcon className="h-6 w-6 mr-1 text-gray-600" />
                      <span>Steady</span>
                    </>
                  )}
                </div>
                <div className="text-sm font-medium mt-1">
                  {summaryStats.bestTrendPlayer.name} ({summaryStats.bestTrendPlayer.team})
                </div>
              </>
            ) : (
              <div className="text-lg text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Quarter Overview</TabsTrigger>
          <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
          <TabsTrigger value="trends">Quarter Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Player
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Team
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Q1
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Q2
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Q3
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Q4
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers
                      .sort((a, b) => b.quarters.total - a.quarters.total)
                      .map((player) => (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {player.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.team}</td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                              player.quarters.q1 ===
                                Math.max(
                                  player.quarters.q1,
                                  player.quarters.q2,
                                  player.quarters.q3,
                                  player.quarters.q4,
                                ) && player.quarters.q1 > 0
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {player.quarters.q1 || "-"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                              player.quarters.q2 ===
                                Math.max(
                                  player.quarters.q1,
                                  player.quarters.q2,
                                  player.quarters.q3,
                                  player.quarters.q4,
                                ) && player.quarters.q2 > 0
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {player.quarters.q2 || "-"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                              player.quarters.q3 ===
                                Math.max(
                                  player.quarters.q1,
                                  player.quarters.q2,
                                  player.quarters.q3,
                                  player.quarters.q4,
                                ) && player.quarters.q3 > 0
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {player.quarters.q3 || "-"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                              player.quarters.q4 ===
                                Math.max(
                                  player.quarters.q1,
                                  player.quarters.q2,
                                  player.quarters.q3,
                                  player.quarters.q4,
                                ) && player.quarters.q4 > 0
                                ? "font-bold text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {player.quarters.q4 || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center">
                            {player.quarters.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            {player.trend === "up" ? (
                              <ArrowUpIcon className="h-5 w-5 text-green-600 inline" />
                            ) : player.trend === "down" ? (
                              <ArrowDownIcon className="h-5 w-5 text-red-600 inline" />
                            ) : (
                              <MinusIcon className="h-5 w-5 text-gray-400 inline" />
                            )}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        No player data available for this match
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quarter Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-12">Quarter distribution chart will be displayed here</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quarter Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-12">Quarter consistency chart will be displayed here</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Quarter Trend Analysis</h3>
            <div className="text-center text-gray-500 py-12">Quarter trend analysis will be displayed here</div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Understanding Quarter Analysis</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-semibold text-green-600">Green numbers</span> indicate a player's best quarter
          </li>
          <li>
            <span className="inline-flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" /> Improving
            </span>{" "}
            - Player scores increased through quarters
          </li>
          <li>
            <span className="inline-flex items-center">
              <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" /> Declining
            </span>{" "}
            - Player scores decreased through quarters
          </li>
          <li>
            <span className="inline-flex items-center">
              <MinusIcon className="h-4 w-4 text-gray-400 mr-1" /> Steady
            </span>{" "}
            - Player maintained consistent scoring
          </li>
        </ul>
      </div>
    </div>
  )
}
