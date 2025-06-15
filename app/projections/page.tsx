"use client"

import type React from "react"
import { Loader2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import type { Player } from "@/lib/teamData"
import { getTeamLogoPath } from "@/lib/teamLogos"
import Navbar from "@/components/layout/Navbar"
import TeamTabs from "@/components/team-builder/TeamTabs"
import type { MatchResult } from "@/lib/matchData"

// Prevent NextRouter errors during SSR
export const dynamic = "force-dynamic"

// Add debug logging to help identify issues with specific players

// Add this function near the top of the file, after the imports:
function debugPlayer(player: any, stats: any[], message: string) {
  if (player.name?.includes("O'Kearney") || player.name?.includes("Hanson")) {
    console.log(`DEBUG ${message} for ${player.name}:`, {
      player,
      statsFound: stats.length,
      stats: stats.slice(0, 3), // Show first 3 stats only to avoid console clutter
    })
  }
}

// Add a more comprehensive name matching function to handle various name formats

// Add this function near the top of the file:
function matchPlayerNames(playerName1: string, playerName2: string): boolean {
  if (!playerName1 || !playerName2) return false

  // Direct match
  if (playerName1.toLowerCase() === playerName2.toLowerCase()) return true

  // Normalize both names (remove special chars, extra spaces)
  const normalize = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  const norm1 = normalize(playerName1)
  const norm2 = normalize(playerName2)

  if (norm1 === norm2) return true

  // Check if one name is contained within the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true

  // Check for name parts (first/last name matching)
  const parts1 = norm1.split(" ")
  const parts2 = norm2.split(" ")

  // If both first and last names match
  if (parts1.length >= 2 && parts2.length >= 2) {
    const firstName1 = parts1[0]
    const lastName1 = parts1[parts1.length - 1]
    const firstName2 = parts2[0]
    const lastName2 = parts2[parts2.length - 1]

    if (firstName1 === firstName2 && lastName1 === lastName2) return true
  }

  return false
}

// Define the projection type
interface PlayerProjection extends Player {
  projectedScore: number
  projectedPriceChange: number
  nextOpponent: string
  nextMatchDate?: string
  upcomingFixtures: string[]
  confidence: number
  opponentStrength: number
  realAverageScore: number // Add real calculated average
  gamesPlayed: number
}

// Define the salary cap constant
const SALARY_CAP = 140000

// Update the getTeamNextOpponents function to also return match dates
function getTeamNextOpponents(matches: MatchResult[]): Record<string, { opponent: string; date: string }> {
  const today = new Date()
  const teamNextOpponents: Record<string, { opponent: string; date: string }> = {}

  // Filter to only 2025 season matches
  const season2025Matches = matches.filter((match) => match.season === 2025)

  // Sort matches by date (earliest first)
  const sortedMatches = [...season2025Matches].sort((a, b) => {
    try {
      const [aDay, aMonth, aYear] = a.date.split("/").map(Number)
      const [bDay, bMonth, bYear] = b.date.split("/").map(Number)

      const dateA = new Date(aYear, aMonth - 1, aDay)
      const dateB = new Date(bYear, bMonth - 1, bDay)

      return dateA.getTime() - dateB.getTime()
    } catch (e) {
      console.error("Error sorting dates:", e, a.date, b.date)
      return 0
    }
  })

  // Find the next match for each team
  for (const match of sortedMatches) {
    try {
      const [day, month, year] = match.date.split("/").map(Number)
      const matchDate = new Date(year, month - 1, day)

      // Only consider future matches
      if (matchDate >= today) {
        // If this team doesn't have a next opponent yet, set it
        if (!teamNextOpponents[match.homeTeam]) {
          teamNextOpponents[match.homeTeam] = {
            opponent: match.awayTeam,
            date: match.date,
          }
        }

        if (!teamNextOpponents[match.awayTeam]) {
          teamNextOpponents[match.awayTeam] = {
            opponent: match.homeTeam,
            date: match.date,
          }
        }
      }
    } catch (e) {
      console.error("Error parsing date:", e, match.date)
    }
  }

  return teamNextOpponents
}

// Helper function to get upcoming fixtures for a team
function getUpcomingFixtures(matches: MatchResult[], teamName: string, limit = 3): string[] {
  const today = new Date()
  const fixtures: string[] = []

  // Filter to only 2025 season matches involving this team
  const teamMatches = matches.filter(
    (match) => match.season === 2025 && (match.homeTeam === teamName || match.awayTeam === teamName),
  )

  // Sort matches by date (earliest first)
  const sortedMatches = [...teamMatches].sort((a, b) => {
    try {
      const [aDay, aMonth, aYear] = a.date.split("/").map(Number)
      const [bDay, bMonth, bYear] = b.date.split("/").map(Number)

      const dateA = new Date(aYear, aMonth - 1, aDay)
      const dateB = new Date(bYear, bMonth - 1, bYear)

      return dateA.getTime() - dateB.getTime()
    } catch (e) {
      console.error("Error sorting dates:", e, a.date, b.date)
      return 0
    }
  })

  // Find the next matches for this team
  for (const match of sortedMatches) {
    try {
      const [day, month, year] = match.date.split("/").map(Number)
      const matchDate = new Date(year, month - 1, day)

      // Only consider future matches
      if (matchDate >= today) {
        // Add the opponent to the fixtures list
        const opponent = match.homeTeam === teamName ? match.awayTeam : match.homeTeam
        fixtures.push(opponent)

        // Stop once we have enough fixtures
        if (fixtures.length >= limit) {
          break
        }
      }
    } catch (e) {
      console.error("Error parsing date:", e, match.date)
    }
  }

  // If we don't have enough fixtures, fill with placeholders
  while (fixtures.length < limit) {
    fixtures.push("TBD")
  }

  return fixtures
}

// Helper function to format date in Australian format (DD/MM/YYYY)
function formatAustralianDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0") // Month is 0-indexed
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper function to format currency
function formatCurrency(value: number): string {
  return "$" + value.toLocaleString()
}

// Function to generate a deterministic random number based on a seed
function seededRandom(seed: string): () => number {
  let s = Array.from(seed).reduce((a, b) => {
    return a + b.charCodeAt(0)
  }, 0)

  return () => {
    const x = Math.sin(s++) * 10000
    return x - Math.floor(x)
  }
}

// New function to calculate team strength based on match history
function calculateTeamStrength(matches: MatchResult[], teamName: string): number {
  if (!matches || !teamName) return 0

  // Filter to only completed matches involving this team (with scores)
  const teamMatches = matches.filter(
    (match) =>
      (match.homeTeam === teamName || match.awayTeam === teamName) && (match.homeScore > 0 || match.awayScore > 0),
  )

  if (teamMatches.length === 0) return 0

  // Calculate average margin (positive for wins, negative for losses)
  let totalMargin = 0
  teamMatches.forEach((match) => {
    if (match.homeTeam === teamName) {
      totalMargin += match.homeScore - match.awayScore
    } else {
      totalMargin += match.awayScore - match.homeScore
    }
  })

  // Calculate average margin per game
  const averageMargin = totalMargin / teamMatches.length

  // Convert to a strength rating between -1 and 1
  // -1 = very weak (loses by 200+ points)
  // 0 = average
  // 1 = very strong (wins by 200+ points)
  const strength = Math.max(-1, Math.min(1, averageMargin / 200))

  return strength
}

export default function ProjectionsPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allPlayers, setAllPlayers] = useState<PlayerProjection[]>([])
  const [teamPlayers, setTeamPlayers] = useState<PlayerProjection[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState<string>("All")
  const [teamFilter, setTeamFilter] = useState<string>("All")
  const [sortBy, setSortBy] = useState<string>("projectedScore")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      // Use the existing fetchPlayerData function
      const { fetchPlayerData } = await import("@/lib/playerData")
      const { fetchMatchData } = await import("@/lib/matchData")

      const playerData = await fetchPlayerData()

      // Load saved team from localStorage
      const savedTeam = localStorage.getItem("fantasyTeam")
      let selectedPlayerIds: string[] = []
      if (savedTeam) {
        try {
          const teamData = JSON.parse(savedTeam)
          selectedPlayerIds = teamData.players ? teamData.players.map((p: Player) => p.id) : []
        } catch (error) {
          console.error("Error parsing team data:", error)
        }
      }

      // Fetch match data to determine next opponents
      const matchData = await fetchMatchData()

      // Get next opponents for each team
      const teamNextOpponents = getTeamNextOpponents(matchData)

      // Calculate strength ratings for all teams
      const teamStrengths: Record<string, number> = {}
      const allTeams = Array.from(
        new Set([...matchData.map((match) => match.homeTeam), ...matchData.map((match) => match.awayTeam)]),
      )

      allTeams.forEach((team) => {
        teamStrengths[team] = calculateTeamStrength(matchData, team)
      })

      // Load player stats from Firebase
      const { collection, getDocs } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      // Fetch all player stats
      const playerStatsRef = collection(db, "playerStats")
      const statsSnapshot = await getDocs(playerStatsRef)
      const allStats = statsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // Create projections for players
      const playersWithProjections: PlayerProjection[] = playerData.map((player: Player) => {
        // Get player stats
        const playerStatsRecords = allStats.filter((stat) => {
          const playerId = player.registryId || player.id

          // First try to match by player ID (most reliable)
          if (stat.playerId && stat.playerId === playerId) {
            return true
          }

          // Then try name matching
          return (
            matchPlayerNames(stat.playerName, player.name) && stat.team?.toLowerCase() === player.team?.toLowerCase()
          )
        })

        // Filter to only "Total" or "All" quarter records for season averages
        const totalRecords = playerStatsRecords.filter((stat) =>
          ["Total", "All", "total", "all"].includes(stat.quarter),
        )

        let realAverageScore = 50 // Default if no stats
        let gamesPlayed = 0

        if (totalRecords.length > 0) {
          // Calculate real season average from actual game data
          const totalPoints = totalRecords.reduce((sum, stat) => sum + (stat.fantasyPoints || 0), 0)
          gamesPlayed = totalRecords.length
          realAverageScore = Math.round((totalPoints / gamesPlayed) * 10) / 10 // Round to 1 decimal
        }

        // Get the next opponent for this player's team
        const nextOpponentInfo = teamNextOpponents[player.team] || { opponent: "TBD", date: "" }
        const nextOpponent = nextOpponentInfo.opponent
        const nextMatchDate = nextOpponentInfo.date

        // Get opponent strength (-1 to 1 scale)
        const opponentStrength = teamStrengths[nextOpponent] || 0

        // Calculate projection adjustments
        const opponentAdjustment = -opponentStrength * 0.2 // Up to 20% adjustment for opponent
        const randomVariation = (Math.random() - 0.5) * 0.1 // Small random element

        // Calculate final projection based on REAL average
        const totalAdjustment = opponentAdjustment + randomVariation
        const projectedScore = Math.round(realAverageScore * (1 + totalAdjustment))

        // Get upcoming fixtures for this team
        const upcomingFixtures = getUpcomingFixtures(matchData, player.team, 3)

        return {
          ...player,
          projectedScore,
          projectedPriceChange: Math.round((projectedScore - realAverageScore) * 100),
          nextOpponent,
          nextMatchDate,
          upcomingFixtures,
          confidence: Math.round(Math.random() * 100), // Placeholder
          opponentStrength,
          realAverageScore,
          gamesPlayed,
        }
      })

      setAllPlayers(playersWithProjections)

      // Filter to only show players in the user's team
      const selectedPlayers = playersWithProjections.filter((player) => selectedPlayerIds.includes(player.id))

      setTeamPlayers(selectedPlayers)
    } catch (error) {
      console.error("Error loading player data:", error)
      setTeamPlayers([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate team projection stats
  const teamProjectionStats = useMemo(() => {
    if (teamPlayers.length === 0) {
      return {
        totalProjectedScore: 0,
        averageProjectedScore: 0,
        highestProjectedPlayer: null as PlayerProjection | null,
        lowestProjectedPlayer: null as PlayerProjection | null,
        defenseProjectedScore: 0,
        defensePlayerCount: 0,
        midfielderProjectedScore: 0,
        midfielderPlayerCount: 0,
        forwardProjectedScore: 0,
        forwardPlayerCount: 0,
      }
    }

    // Calculate score projections
    const totalProjectedScore = teamPlayers.reduce((sum, player) => sum + player.projectedScore, 0)
    const averageProjectedScore = Math.round(totalProjectedScore / teamPlayers.length)

    // Sort players by projected score to find highest and lowest
    const sortedByProjection = [...teamPlayers].sort((a, b) => b.projectedScore - a.projectedScore)
    const highestProjectedPlayer = sortedByProjection[0]
    const lowestProjectedPlayer = sortedByProjection[sortedByProjection.length - 1]

    // Calculate position-based projections
    const defPlayers = teamPlayers.filter((player) => player.position === "DEF")
    const midPlayers = teamPlayers.filter((player) => player.position === "MID" || player.position === "RUC")
    const fwdPlayers = teamPlayers.filter((player) => player.position === "FWD")

    const defenseProjectedScore = defPlayers.reduce((sum, player) => sum + player.projectedScore, 0)
    const midfielderProjectedScore = midPlayers.reduce((sum, player) => sum + player.projectedScore, 0)
    const forwardProjectedScore = fwdPlayers.reduce((sum, player) => sum + player.projectedScore, 0)

    return {
      totalProjectedScore,
      averageProjectedScore,
      highestProjectedPlayer,
      lowestProjectedPlayer,
      defenseProjectedScore,
      defensePlayerCount: defPlayers.length,
      midfielderProjectedScore,
      midfielderPlayerCount: midPlayers.length,
      forwardProjectedScore,
      forwardPlayerCount: fwdPlayers.length,
    }
  }, [teamPlayers])

  // Improved image error handling
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  // Player card component for reuse
  const PlayerCard = ({ player }: { player: PlayerProjection }) => (
    <div className="bg-white rounded-md shadow-sm p-2 mb-2 text-xs hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-6 w-6 mr-1">
            <img
              src={getTeamLogoPath(player.team) || "/placeholder.svg"}
              alt={player.team}
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              onError={handleImageError}
            />
          </div>
          <div>
            <div className="font-medium text-gray-900">{player.name}</div>
            <div className="text-gray-500">
              {player.position} | ${player.price.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-blue-600">Proj: {player.projectedScore}</div>
          <div className="text-gray-500">Avg: {player.realAverageScore}</div>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-4 w-4 mr-1">
            <img
              src={getTeamLogoPath(player.nextOpponent) || "/placeholder.svg"}
              alt={player.nextOpponent}
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
              onError={handleImageError}
            />
          </div>
          <span className="text-gray-600">Next: {player.nextOpponent}</span>
        </div>
        {player.opponentStrength < -0.3 && (
          <span className="text-xs text-green-600 font-medium">Favorable matchup</span>
        )}
        {player.opponentStrength > 0.3 && <span className="text-xs text-red-600 font-medium">Tough matchup</span>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div id="projections-container" className="container mx-auto py-8">
        {mounted ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Player Projections</h1>

            <TeamTabs activeTab="projections" />

            <div className="mt-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="mt-4 text-gray-500">Loading projections data...</p>
                </div>
              ) : teamPlayers.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">You haven't selected any players for your team yet.</p>
                  <a
                    href="/team-builder"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Team Builder
                  </a>
                </div>
              ) : (
                <>
                  {/* Team Projection Summary */}
                  <div className="bg-white shadow rounded-lg p-3 mb-4">
                    <h2 className="text-base font-semibold mb-2">Team Projection Summary</h2>

                    <div className="space-y-3">
                      {/* Total Projected Score - Full Width */}
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 mb-1">Total Projected Score</div>
                        <div className="text-3xl font-bold text-blue-700">
                          {teamProjectionStats.totalProjectedScore}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Average: {teamProjectionStats.averageProjectedScore} points per player
                        </div>
                      </div>

                      {/* Position-based scores in a row */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Defense Team Projected Score */}
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">DEF Team</div>
                          <div className="text-xl font-bold text-green-700">
                            {teamProjectionStats.defenseProjectedScore}
                          </div>
                          <div className="text-xs text-gray-500">{teamProjectionStats.defensePlayerCount} players</div>
                        </div>

                        {/* Midfield Team Projected Score */}
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">MID Team</div>
                          <div className="text-xl font-bold text-purple-700">
                            {teamProjectionStats.midfielderProjectedScore}
                          </div>
                          <div className="text-xs text-gray-500">
                            {teamProjectionStats.midfielderPlayerCount} players
                          </div>
                        </div>

                        {/* Forward Team Projected Score */}
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">FWD Team</div>
                          <div className="text-xl font-bold text-red-700">
                            {teamProjectionStats.forwardProjectedScore}
                          </div>
                          <div className="text-xs text-gray-500">{teamProjectionStats.forwardPlayerCount} players</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compact Filters */}
                  <div className="bg-white shadow rounded-lg p-2 mb-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex-grow min-w-[150px]">
                        <input
                          type="text"
                          placeholder="Search players..."
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="flex-grow min-w-[100px]">
                        <select
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value={positionFilter}
                          onChange={(e) => setPositionFilter(e.target.value)}
                        >
                          <option value="All">All Positions</option>
                          <option value="DEF">DEF</option>
                          <option value="MID">MID</option>
                          <option value="RUC">RUC</option>
                          <option value="FWD">FWD</option>
                        </select>
                      </div>

                      <div className="flex-grow min-w-[100px]">
                        <select
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value={teamFilter}
                          onChange={(e) => setTeamFilter(e.target.value)}
                        >
                          {["All", ...Array.from(new Set(teamPlayers.map((player) => player.team))).sort()].map(
                            (team) => (
                              <option key={team} value={team}>
                                {team}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div className="flex-grow min-w-[120px]">
                        <select
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="projectedScore">Sort: Projected Score</option>
                          <option value="name">Sort: Name</option>
                          <option value="position">Sort: Position</option>
                          <option value="price">Sort: Price</option>
                          <option value="realAverageScore">Sort: Real Average</option>
                        </select>
                      </div>

                      <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="p-1 border border-gray-300 rounded-md bg-gray-50 text-xs"
                      >
                        {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                      </button>
                    </div>
                  </div>

                  {/* Two-column player cards */}
                  {teamPlayers.length === 0 ? (
                    <div className="bg-white shadow rounded-lg p-4 text-center text-gray-500 text-sm">
                      No players match your filter criteria
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left Column */}
                      <div>
                        {teamPlayers
                          .filter((_, index) => index % 2 === 0)
                          .map((player) => (
                            <PlayerCard key={player.id} player={player} />
                          ))}
                      </div>

                      {/* Right Column */}
                      <div>
                        {teamPlayers
                          .filter((_, index) => index % 2 === 1)
                          .map((player) => (
                            <PlayerCard key={player.id} player={player} />
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading projections data...</span>
          </div>
        )}
      </div>
    </div>
  )
}
