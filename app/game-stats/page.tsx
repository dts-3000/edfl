"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, TrendingDown, Minus, Trophy, Star, Target, Users } from "lucide-react"
import { getMatches, getPlayerStatsForMatch } from "@/lib/playerStats"
import Navbar from "@/components/layout/Navbar"
import { getTeamLogoPath } from "@/lib/teamLogos"

// Prevent NextRouter errors during SSR
export const dynamic = "force-dynamic"

interface PlayerStat {
  id?: string
  season: string | number
  round: string | number
  team: string
  playerNumber: string
  playerName: string
  playerId?: string
  quarter: string
  kicks: number
  handballs: number
  marks: number
  tackles: number
  hitOuts: number
  goals: number
  behinds: number
  fantasyPoints: number
  matchId: string
  position?: string
}

interface MatchData {
  id: string
  season: string | number
  round: string | number
  homeTeam: string
  awayTeam: string
  date: string
  venue?: string
  hasStats?: boolean
}

interface QuarterStats {
  quarter: string
  kicks: number
  handballs: number
  marks: number
  tackles: number
  hitOuts: number
  goals: number
  behinds: number
  fantasyPoints: number
}

interface PlayerQuarterBreakdown {
  playerName: string
  playerNumber: string
  team: string
  quarters: QuarterStats[]
  total: QuarterStats
  trend: "up" | "down" | "stable"
}

// Position types
type Position = "MID" | "DEF" | "RUC" | "FWD"

export default function GameStatsPage() {
  // Safe client-side only rendering
  const [mounted, setMounted] = useState(false)

  // Game stats state
  const [loading, setLoading] = useState(true)
  const [seasons, setSeasons] = useState<string[]>([])
  const [rounds, setRounds] = useState<string[]>([])
  const [games, setGames] = useState<MatchData[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>("")
  const [selectedRound, setSelectedRound] = useState<string>("")
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [activeTab, setActiveTab] = useState("home")
  const [loadingStats, setLoadingStats] = useState(false)
  const [quarterView, setQuarterView] = useState<string>("All")

  // Ensure we're on client side before doing anything
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load matches on component mount
  useEffect(() => {
    if (!mounted) return

    const loadMatches = async () => {
      try {
        setLoading(true)
        const matches = await getMatches()

        // Filter matches with stats
        const matchesWithStats = matches.filter((match) => match.hasStats)

        // Extract unique seasons
        const uniqueSeasons = [...new Set(matchesWithStats.map((match) => match.season.toString()))].sort(
          (a, b) => Number.parseInt(b) - Number.parseInt(a),
        ) // Sort descending

        setSeasons(uniqueSeasons)

        // Set default selected season if available
        if (uniqueSeasons.length > 0) {
          setSelectedSeason(uniqueSeasons[0])
        }

        setGames(matchesWithStats)
      } catch (error) {
        console.error("Error loading matches:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [mounted])

  // Update rounds when season changes
  useEffect(() => {
    if (!mounted) return

    if (selectedSeason) {
      const seasonGames = games.filter((game) => game.season.toString() === selectedSeason)
      const uniqueRounds = [...new Set(seasonGames.map((game) => game.round.toString()))].sort((a, b) => {
        // Try to sort numerically first
        const numA = Number.parseInt(a)
        const numB = Number.parseInt(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        // Fall back to string comparison
        return a.localeCompare(b)
      })

      setRounds(uniqueRounds)

      // Set the latest round as default
      if (uniqueRounds.length > 0) {
        const latestRound = uniqueRounds[uniqueRounds.length - 1]
        setSelectedRound(latestRound)
      } else {
        setSelectedRound("")
      }

      setSelectedGame("")
      setPlayerStats([])
    }
  }, [selectedSeason, games, mounted])

  // Update games when round changes
  useEffect(() => {
    if (!mounted) return

    if (selectedSeason && selectedRound) {
      const filteredGames = games.filter(
        (game) => game.season.toString() === selectedSeason && game.round.toString() === selectedRound,
      )

      // Reset selected game
      setSelectedGame("")
      setPlayerStats([])
    }
  }, [selectedRound, selectedSeason, games, mounted])

  // Load player stats when game changes
  useEffect(() => {
    if (!mounted) return

    const loadPlayerStats = async () => {
      if (selectedGame) {
        try {
          setLoadingStats(true)
          const stats = await getPlayerStatsForMatch(selectedGame)
          setPlayerStats(stats)

          // Set default tab to home team
          if (stats.length > 0) {
            const match = games.find((g) => g.id === selectedGame)
            if (match) {
              const homeTeamStats = stats.find((s) => s.team === match.homeTeam)
              setActiveTab(homeTeamStats ? "home" : "away")
            }
          }
        } catch (error) {
          console.error("Error loading player stats:", error)
        } finally {
          setLoadingStats(false)
        }
      }
    }

    loadPlayerStats()
  }, [selectedGame, games, mounted])

  // Get unique teams from player stats
  const getTeams = () => {
    const teams = [...new Set(playerStats.map((stat) => stat.team))]

    // Try to sort teams so home team is first
    if (selectedGame) {
      const match = games.find((g) => g.id === selectedGame)
      if (match) {
        return teams.sort((a, b) => {
          if (a === match.homeTeam) return -1
          if (b === match.homeTeam) return 1
          return 0
        })
      }
    }

    return teams
  }

  // Get player stats for a specific team and quarter
  const getTeamStats = (team: string, quarter = "All") => {
    return playerStats.filter((stat) => {
      if (stat.team !== team) return false

      // Handle both quarter formats
      let normalizedQuarter = stat.quarter
      if (stat.quarter.toLowerCase() === "q1") normalizedQuarter = "1"
      if (stat.quarter.toLowerCase() === "q2") normalizedQuarter = "2"
      if (stat.quarter.toLowerCase() === "q3") normalizedQuarter = "3"
      if (stat.quarter.toLowerCase() === "q4") normalizedQuarter = "4"

      // Handle both "All" and "Total" as the same thing
      if (quarter === "All" && (normalizedQuarter === "All" || normalizedQuarter === "Total")) return true
      if (quarter === "Total" && (normalizedQuarter === "All" || normalizedQuarter === "Total")) return true

      return normalizedQuarter === quarter
    })
  }

  // Check if quarter-by-quarter data is available
  const hasQuarterData = () => {
    const quarters = [...new Set(playerStats.map((stat) => stat.quarter))]
    return quarters.some((q) => q !== "All" && ["1", "2", "3", "4"].includes(q))
  }

  // Get available quarters
  const getAvailableQuarters = () => {
    const quarters = [...new Set(playerStats.map((stat) => stat.quarter))].sort()

    // Normalize quarter values and filter
    const normalizedQuarters = quarters.map((q) => {
      if (q.toLowerCase() === "q1") return "1"
      if (q.toLowerCase() === "q2") return "2"
      if (q.toLowerCase() === "q3") return "3"
      if (q.toLowerCase() === "q4") return "4"
      if (q === "Total") return "All" // Convert Total to All
      return q
    })

    return [...new Set(normalizedQuarters)].filter((q) => q === "All" || ["1", "2", "3", "4"].includes(q))
  }

  // Get quarter breakdown for a player
  const getPlayerQuarterBreakdown = (playerName: string, team: string): PlayerQuarterBreakdown | null => {
    const playerQuarterStats = playerStats.filter(
      (stat) => stat.playerName === playerName && stat.team === team && stat.quarter !== "All",
    )

    if (playerQuarterStats.length === 0) return null

    const quarters: QuarterStats[] = ["1", "2", "3", "4"].map((q) => {
      const quarterStat = playerQuarterStats.find((stat) => stat.quarter === q)
      return {
        quarter: q,
        kicks: quarterStat?.kicks || 0,
        handballs: quarterStat?.handballs || 0,
        marks: quarterStat?.marks || 0,
        tackles: quarterStat?.tackles || 0,
        hitOuts: quarterStat?.hitOuts || 0,
        goals: quarterStat?.goals || 0,
        behinds: quarterStat?.behinds || 0,
        fantasyPoints: quarterStat?.fantasyPoints || 0,
      }
    })

    // Calculate total
    const total: QuarterStats = {
      quarter: "Total",
      kicks: quarters.reduce((sum, q) => sum + q.kicks, 0),
      handballs: quarters.reduce((sum, q) => sum + q.handballs, 0),
      marks: quarters.reduce((sum, q) => sum + q.marks, 0),
      tackles: quarters.reduce((sum, q) => sum + q.tackles, 0),
      hitOuts: quarters.reduce((sum, q) => sum + q.hitOuts, 0),
      goals: quarters.reduce((sum, q) => sum + q.goals, 0),
      behinds: quarters.reduce((sum, q) => sum + q.behinds, 0),
      fantasyPoints: quarters.reduce((sum, q) => sum + q.fantasyPoints, 0),
    }

    // Calculate trend based on fantasy points
    const nonZeroQuarters = quarters.filter((q) => q.fantasyPoints > 0)
    let trend: "up" | "down" | "stable" = "stable"

    if (nonZeroQuarters.length >= 2) {
      const firstHalf = nonZeroQuarters.slice(0, Math.ceil(nonZeroQuarters.length / 2))
      const secondHalf = nonZeroQuarters.slice(Math.ceil(nonZeroQuarters.length / 2))

      const firstHalfAvg = firstHalf.reduce((sum, q) => sum + q.fantasyPoints, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, q) => sum + q.fantasyPoints, 0) / secondHalf.length

      if (secondHalfAvg > firstHalfAvg * 1.1) trend = "up"
      else if (secondHalfAvg < firstHalfAvg * 0.9) trend = "down"
    }

    const playerNumber = playerQuarterStats[0]?.playerNumber || ""

    return {
      playerName,
      playerNumber,
      team,
      quarters,
      total,
      trend,
    }
  }

  // Get team quarter breakdown
  const getTeamQuarterBreakdown = (team: string) => {
    const players = [...new Set(playerStats.filter((stat) => stat.team === team).map((stat) => stat.playerName))]
    return players
      .map((playerName) => getPlayerQuarterBreakdown(playerName, team))
      .filter(Boolean) as PlayerQuarterBreakdown[]
  }

  // Get match details
  const getSelectedMatch = () => {
    return games.find((game) => game.id === selectedGame)
  }

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  // Use ONLY the position field - no inference
  const getPlayerPosition = (stat: PlayerStat): Position | null => {
    if (!stat.position) return null

    // Exact match only
    if (stat.position === "DEF") return "DEF"
    if (stat.position === "MID") return "MID"
    if (stat.position === "RUC") return "RUC"
    if (stat.position === "FWD") return "FWD"

    return null
  }

  // Get top 4 players by position for the active team
  const getPositionStats = (team: string) => {
    const teamStats = getTeamStats(team, quarterView)

    // Group players by position
    const positionGroups: Record<Position, PlayerStat[]> = {
      MID: [],
      DEF: [],
      RUC: [],
      FWD: [],
    }

    // Assign players to position groups - only if they have a valid position
    teamStats.forEach((stat) => {
      const position = getPlayerPosition(stat)
      if (position) {
        positionGroups[position].push(stat)
      }
    })

    // Get top 4 players for each position
    const getTop4 = (players: PlayerStat[]) => {
      return players
        .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
        .slice(0, 4)
        .map((p) => ({
          name: p.playerName,
          number: p.playerNumber,
          points: p.fantasyPoints,
          goals: p.goals,
          marks: p.marks,
          tackles: p.tackles,
        }))
    }

    return {
      MID: {
        count: positionGroups.MID.length,
        top4: getTop4(positionGroups.MID),
        totalPoints: positionGroups.MID.reduce((sum, p) => sum + p.fantasyPoints, 0),
      },
      DEF: {
        count: positionGroups.DEF.length,
        top4: getTop4(positionGroups.DEF),
        totalPoints: positionGroups.DEF.reduce((sum, p) => sum + p.fantasyPoints, 0),
      },
      RUC: {
        count: positionGroups.RUC.length,
        top4: getTop4(positionGroups.RUC),
        totalPoints: positionGroups.RUC.reduce((sum, p) => sum + p.fantasyPoints, 0),
      },
      FWD: {
        count: positionGroups.FWD.length,
        top4: getTop4(positionGroups.FWD),
        totalPoints: positionGroups.FWD.reduce((sum, p) => sum + p.fantasyPoints, 0),
      },
    }
  }

  // Get trend icon
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  // Get summary statistics for all loaded data
  const getSummaryStats = () => {
    if (playerStats.length === 0) return null

    const allStats =
      quarterView === "All"
        ? playerStats.filter((stat) => stat.quarter === "All" || stat.quarter === "Total")
        : playerStats.filter((stat) => stat.quarter === quarterView)

    if (allStats.length === 0) return null

    // Highest individual score
    const highestScore = Math.max(...allStats.map((stat) => stat.fantasyPoints))
    const highestScorer = allStats.find((stat) => stat.fantasyPoints === highestScore)

    // Top 10 scores
    const top10Scores = allStats.sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, 10)

    // Most goals in a game/quarter
    const mostGoals = Math.max(...allStats.map((stat) => stat.goals))
    const topGoalScorer = allStats.find((stat) => stat.goals === mostGoals)

    // Most tackles
    const mostTackles = Math.max(...allStats.map((stat) => stat.tackles))
    const topTackler = allStats.find((stat) => stat.tackles === mostTackles)

    // Team totals
    const teams = [...new Set(allStats.map((stat) => stat.team))]
    const teamTotals = teams
      .map((team) => {
        const teamStats = allStats.filter((stat) => stat.team === team)
        const totalPoints = teamStats.reduce((sum, stat) => sum + stat.fantasyPoints, 0)
        const totalGoals = teamStats.reduce((sum, stat) => sum + stat.goals, 0)
        return { team, totalPoints, totalGoals, playerCount: teamStats.length }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)

    return {
      highestScore,
      highestScorer,
      top10Scores,
      mostGoals,
      topGoalScorer,
      mostTackles,
      topTackler,
      teamTotals,
    }
  }

  // If not mounted yet, show minimal loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Game Statistics</h1>

        {/* Season Leaders - Show when no game is selected */}
        {/* Filters */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading match data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season-select">Season</Label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason} disabled={seasons.length === 0}>
                  <SelectTrigger id="season-select">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((season) => (
                      <SelectItem key={season} value={season}>
                        {season}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round-select">Round</Label>
                <Select
                  value={selectedRound}
                  onValueChange={setSelectedRound}
                  disabled={!selectedSeason || rounds.length === 0}
                >
                  <SelectTrigger id="round-select">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {rounds.map((round) => (
                      <SelectItem key={round} value={round}>
                        Round {round}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="game-select">Game</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame} disabled={!selectedRound}>
                  <SelectTrigger id="game-select">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games
                      .filter(
                        (game) => game.season.toString() === selectedSeason && game.round.toString() === selectedRound,
                      )
                      .map((game) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.homeTeam} vs {game.awayTeam}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Top 20 Fantasy Points - Show when filters are selected but no specific game */}
            {selectedSeason && selectedRound && !selectedGame && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-6 w-6 mr-2 text-yellow-600" />
                    Top 20 Fantasy Performances - Season {selectedSeason}, Round {selectedRound}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {games.filter(
                      (game) => game.season.toString() === selectedSeason && game.round.toString() === selectedRound,
                    ).length > 0 ? (
                      <div className="text-sm text-gray-600 mb-4">
                        Select a game above to see the top performances from that round
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No games found for this round</p>
                      </div>
                    )}

                    {/* Placeholder for top 20 - this would be populated with actual data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">Expected Top Performers:</h4>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>• Select a specific game to see actual top 20</div>
                          <div>• Rankings based on fantasy points</div>
                          <div>• Includes goals, marks, tackles breakdown</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">Available Games:</h4>
                        <div className="space-y-1">
                          {games
                            .filter(
                              (game) =>
                                game.season.toString() === selectedSeason && game.round.toString() === selectedRound,
                            )
                            .map((game) => (
                              <div key={game.id} className="text-sm text-blue-600">
                                {game.homeTeam} vs {game.awayTeam}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Details */}
            {selectedGame && getSelectedMatch() && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>
                    {getSelectedMatch()?.homeTeam} vs {getSelectedMatch()?.awayTeam}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="font-medium">Season:</span> {getSelectedMatch()?.season}
                    </div>
                    <div>
                      <span className="font-medium">Round:</span> {getSelectedMatch()?.round}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {getSelectedMatch()?.date}
                    </div>
                    {getSelectedMatch()?.venue && (
                      <div>
                        <span className="font-medium">Venue:</span> {getSelectedMatch()?.venue}
                      </div>
                    )}
                    {hasQuarterData() && (
                      <div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Quarter-by-Quarter Data Available
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Statistics Cards */}
            {selectedGame && playerStats.length > 0 && getSummaryStats() && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Highest Score Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      <div className="text-sm font-medium text-gray-600">Highest Score</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-yellow-600">{getSummaryStats()?.highestScore}</div>
                      <div className="text-sm text-gray-500">{getSummaryStats()?.highestScorer?.playerName}</div>
                      <div className="text-xs text-gray-400">{getSummaryStats()?.highestScorer?.team}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Most Goals Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <div className="text-sm font-medium text-gray-600">Most Goals</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-green-600">{getSummaryStats()?.mostGoals}</div>
                      <div className="text-sm text-gray-500">{getSummaryStats()?.topGoalScorer?.playerName}</div>
                      <div className="text-xs text-gray-400">{getSummaryStats()?.topGoalScorer?.team}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Most Tackles Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-blue-600" />
                      <div className="text-sm font-medium text-gray-600">Most Tackles</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-blue-600">{getSummaryStats()?.mostTackles}</div>
                      <div className="text-sm text-gray-500">{getSummaryStats()?.topTackler?.playerName}</div>
                      <div className="text-xs text-gray-400">{getSummaryStats()?.topTackler?.team}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Performance Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div className="text-sm font-medium text-gray-600">Leading Team</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-purple-600">{getSummaryStats()?.teamTotals[0]?.team}</div>
                      <div className="text-sm text-gray-500">
                        {getSummaryStats()?.teamTotals[0]?.totalPoints} Fantasy Points
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {/* Team Selector and Full Player Stats */}
            {selectedGame && playerStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Player Statistics</CardTitle>
                  <div className="space-y-2">
                    <Label htmlFor="team-select">Select Team</Label>
                    <Select
                      value={activeTab === "home" ? getTeams()[0] : getTeams()[1]}
                      onValueChange={(team) => {
                        const teamIndex = getTeams().indexOf(team)
                        setActiveTab(teamIndex === 0 ? "home" : "away")
                      }}
                    >
                      <SelectTrigger id="team-select" className="w-64">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTeams().map((team) => (
                          <SelectItem key={team} value={team}>
                            <div className="flex items-center">
                              <div className="h-5 w-5 mr-2">
                                <img
                                  src={getTeamLogoPath(team) || "/images/teams/placeholder.png"}
                                  alt={team}
                                  className="h-5 w-5 object-contain"
                                  onError={handleImageError}
                                />
                              </div>
                              {team}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Quarter Selector */}
                  {hasQuarterData() && (
                    <div className="space-y-2">
                      <Label htmlFor="quarter-select">View Quarter</Label>
                      <Select value={quarterView} onValueChange={setQuarterView}>
                        <SelectTrigger id="quarter-select" className="w-48">
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableQuarters().map((quarter) => (
                            <SelectItem key={quarter} value={quarter}>
                              {quarter === "All" ? "Full Game" : `Quarter ${quarter}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center">
                        <div className="h-6 w-6 mr-2">
                          <img
                            src={
                              getTeamLogoPath(activeTab === "home" ? getTeams()[0] : getTeams()[1]) ||
                              "/images/teams/placeholder.png"
                            }
                            alt={activeTab === "home" ? getTeams()[0] : getTeams()[1]}
                            className="h-6 w-6 object-contain"
                            onError={handleImageError}
                          />
                        </div>
                        {activeTab === "home" ? getTeams()[0] : getTeams()[1]} - All Players
                        {quarterView !== "All" && ` (Quarter ${quarterView})`}
                      </h3>
                      <Badge variant="outline">
                        {getTeamStats(activeTab === "home" ? getTeams()[0] : getTeams()[1], quarterView).length} Players
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {getTeamStats(activeTab === "home" ? getTeams()[0] : getTeams()[1], quarterView)
                        .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
                        .map((stat, index) => (
                          <Card key={stat.id || `${stat.playerName}-${stat.quarter}`} className="relative">
                            <CardContent className="p-4">
                              {/* Ranking Badge */}
                              <div className="absolute -top-2 -left-2">
                                <Badge
                                  variant={index === 0 ? "default" : "secondary"}
                                  className={`
                      ${index === 0 ? "bg-yellow-500 text-white" : ""}
                      ${index === 1 ? "bg-gray-400 text-white" : ""}
                      ${index === 2 ? "bg-amber-600 text-white" : ""}
                    `}
                                >
                                  #{index + 1}
                                </Badge>
                              </div>

                              {/* Player Info */}
                              <div className="text-center mb-3">
                                <div className="font-bold text-lg">
                                  {stat.playerNumber && `${stat.playerNumber}. `}
                                  {stat.playerName}
                                </div>
                                <div className="text-2xl font-bold text-blue-600 mt-1">{stat.fantasyPoints}</div>
                                <div className="text-xs text-gray-500">Fantasy Points</div>
                              </div>

                              {/* Key Stats */}
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Goals:</span>
                                  <span className="font-medium">{stat.goals}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Kicks:</span>
                                  <span className="font-medium">{stat.kicks}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Handballs:</span>
                                  <span className="font-medium">{stat.handballs}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Marks:</span>
                                  <span className="font-medium">{stat.marks}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tackles:</span>
                                  <span className="font-medium">{stat.tackles}</span>
                                </div>
                                {stat.hitOuts > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Hit Outs:</span>
                                    <span className="font-medium">{stat.hitOuts}</span>
                                  </div>
                                )}
                                {stat.behinds > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Behinds:</span>
                                    <span className="font-medium">{stat.behinds}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quarter-by-Quarter Breakdown */}
            {hasQuarterData() && quarterView === "All" && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Quarter-by-Quarter Fantasy Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Player
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Q1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Q2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Q3
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Q4
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trend
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getTeamQuarterBreakdown(activeTab === "home" ? getTeams()[0] : getTeams()[1])
                          .sort((a, b) => b.total.fantasyPoints - a.total.fantasyPoints)
                          .map((player) => (
                            <tr key={player.playerName} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {player.playerNumber && `${player.playerNumber}. `}
                                  {player.playerName}
                                </div>
                              </td>
                              {player.quarters.map((quarter) => (
                                <td key={quarter.quarter} className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{quarter.fantasyPoints}</div>
                                </td>
                              ))}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-blue-600">{player.total.fantasyPoints}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{getTrendIcon(player.trend)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
