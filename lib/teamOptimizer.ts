import type { Player, TeamData } from "./teamData"
import type { MatchResult } from "./matchData"

// Default budget constraint
export const DEFAULT_BUDGET = 6830000

// Optimization preferences interface
export interface OptimizationPreferences {
  formWeight: number
  fixtureWeight: number
  valueWeight: number
  respectCurrentTeam: boolean
  keepCaptain: boolean
  keepViceCaptain: boolean
  maxTeamChanges?: number
  budget: number
}

// Default optimization preferences
export const defaultPreferences: OptimizationPreferences = {
  formWeight: 70,
  fixtureWeight: 60,
  valueWeight: 50,
  respectCurrentTeam: true,
  keepCaptain: true,
  keepViceCaptain: true,
  budget: 6830000,
}

// Calculate fixture difficulty for a team
export function calculateFixtureDifficulty(matches: MatchResult[], teamName: string, season = 2025): number {
  // Get upcoming matches for the team in the current season
  const upcomingMatches = matches.filter(
    (match) =>
      (match.homeTeam === teamName || match.awayTeam === teamName) &&
      match.season === season &&
      match.homeScore === 0 && // Unplayed matches have 0-0 scores
      match.awayScore === 0,
  )

  if (upcomingMatches.length === 0) return 50 // Neutral difficulty if no upcoming matches

  // Calculate average opponent strength based on win percentage
  const opponentStrength = upcomingMatches.map((match) => {
    const opponentName = match.homeTeam === teamName ? match.awayTeam : match.homeTeam

    // Get all matches for this opponent
    const opponentMatches = matches.filter(
      (m) =>
        (m.homeTeam === opponentName || m.awayTeam === opponentName) &&
        m.season === season - 1 && // Use previous season for strength calculation
        (m.homeScore > 0 || m.awayScore > 0), // Only played matches
    )

    if (opponentMatches.length === 0) return 50 // Neutral strength if no data

    // Calculate win percentage
    const wins = opponentMatches.filter(
      (m) =>
        (m.homeTeam === opponentName && m.homeScore > m.awayScore) ||
        (m.awayTeam === opponentName && m.awayScore > m.homeScore),
    ).length

    const winPercentage = (wins / opponentMatches.length) * 100

    // Convert to difficulty (stronger opponents = higher difficulty)
    return winPercentage
  })

  // Average opponent strength
  const averageDifficulty = opponentStrength.reduce((sum, diff) => sum + diff, 0) / opponentStrength.length

  return averageDifficulty
}

// Calculate player optimization score
export function calculatePlayerScore(
  player: Player,
  preferences: OptimizationPreferences,
  matches: MatchResult[],
): number {
  if (!player) return 0

  // Form score (based on average score)
  const formScore = (player.averageScore || 0) * (preferences.formWeight / 100)

  // Value score (points per $1000)
  const valueScore =
    (player.price > 0 ? ((player.averageScore || 0) / player.price) * 10000 : 0) * (preferences.valueWeight / 100)

  // Fixture difficulty score
  const fixtureDifficulty = calculateFixtureDifficulty(matches, player.team)
  // Invert difficulty (easier fixtures = higher score)
  const fixtureScore = ((100 - fixtureDifficulty) / 100) * 100 * (preferences.fixtureWeight / 100)

  // Status penalty (injured players get a big penalty)
  const statusPenalty = player.status === "Injured" ? -1000 : 0

  // Calculate total score
  const totalScore = formScore + valueScore + fixtureScore + statusPenalty

  return totalScore
}

// Calculate team total value
export function calculateTeamValue(players: Player[]): number {
  return players.reduce((sum, player) => sum + (player.price || 0), 0)
}

// Check if team is valid (within budget, correct positions)
export function isTeamValid(players: Player[], budget: number): boolean {
  const totalValue = calculateTeamValue(players)
  if (totalValue > budget) return false

  // Check position counts
  const positionCounts = {
    DEF: players.filter((p) => p.position === "DEF").length,
    MID: players.filter((p) => p.position === "MID").length,
    RUC: players.filter((p) => p.position === "RUC").length,
    FWD: players.filter((p) => p.position === "FWD").length,
  }

  return (
    positionCounts.DEF <= 6 &&
    positionCounts.MID <= 5 &&
    positionCounts.RUC <= 1 &&
    positionCounts.FWD <= 6 &&
    players.length <= 18
  )
}

// Optimize team based on preferences
export function optimizeTeam(
  allPlayers: Player[],
  currentTeam: TeamData,
  matches: MatchResult[],
  preferences: OptimizationPreferences,
): Player[] {
  if (!allPlayers || !currentTeam) return []

  // Create a pool of players to select from
  const playerPool = [...allPlayers]

  // Initialize optimized team
  const optimizedTeam: Player[] = []

  // Track remaining budget
  let remainingBudget = preferences.budget || DEFAULT_BUDGET

  // Position requirements
  const positionLimits = {
    DEF: 6,
    MID: 5,
    RUC: 1,
    FWD: 6,
  }

  const positionCounts = {
    DEF: 0,
    MID: 0,
    RUC: 0,
    FWD: 0,
  }

  // Keep captain if option is selected
  if (preferences.keepCaptain && currentTeam.captain) {
    const captain = currentTeam.players.find((p) => p.id === currentTeam.captain)
    if (captain) {
      optimizedTeam.push(captain)
      positionCounts[captain.position as keyof typeof positionCounts]++
      remainingBudget -= captain.price
    }
  }

  // Keep vice captain if option is selected
  if (preferences.keepViceCaptain && currentTeam.viceCaptain) {
    const viceCaptain = currentTeam.players.find((p) => p.id === currentTeam.viceCaptain)
    if (viceCaptain && !optimizedTeam.some((p) => p.id === viceCaptain.id)) {
      optimizedTeam.push(viceCaptain)
      positionCounts[viceCaptain.position as keyof typeof positionCounts]++
      remainingBudget -= viceCaptain.price
    }
  }

  // Calculate optimization scores for all players
  const scoredPlayers = playerPool
    .filter((p) => !optimizedTeam.some((op) => op.id === p.id)) // Remove already selected players
    .map((p) => ({
      ...p,
      optimizationScore: calculatePlayerScore(p, preferences, matches),
    }))
    .sort((a, b) => (b.optimizationScore || 0) - (a.optimizationScore || 0))

  // If respecting current team, prioritize current players
  if (preferences.respectCurrentTeam) {
    // Get current players not already in optimized team
    const currentPlayers = currentTeam.players
      .filter((p) => !optimizedTeam.some((op) => op.id === p.id))
      .map((p) => {
        const scoredPlayer = scoredPlayers.find((sp) => sp.id === p.id)
        return scoredPlayer || p
      })

    // Sort by optimization score
    currentPlayers.sort((a, b) => ((b as any).optimizationScore || 0) - ((a as any).optimizationScore || 0))

    // Add current players to optimized team if they fit position limits and budget
    for (const player of currentPlayers) {
      const position = player.position as keyof typeof positionCounts
      if (positionCounts[position] < positionLimits[position] && player.price <= remainingBudget) {
        optimizedTeam.push(player)
        positionCounts[position]++
        remainingBudget -= player.price
      }
    }
  }

  // Fill remaining positions with best available players that fit the budget
  for (const position of Object.keys(positionLimits) as Array<keyof typeof positionLimits>) {
    const limit = positionLimits[position]
    const count = positionCounts[position]

    if (count < limit) {
      const positionPlayers = scoredPlayers
        .filter(
          (p) => p.position === position && !optimizedTeam.some((op) => op.id === p.id) && p.price <= remainingBudget,
        )
        .slice(0, limit - count)

      for (const player of positionPlayers) {
        optimizedTeam.push(player)
        positionCounts[position]++
        remainingBudget -= player.price
      }
    }
  }

  // If we still don't have enough players and have budget left, add best available regardless of position
  if (optimizedTeam.length < 18 && remainingBudget > 0) {
    const remainingPlayers = scoredPlayers
      .filter((p) => !optimizedTeam.some((op) => op.id === p.id) && p.price <= remainingBudget)
      .sort((a, b) => (b.optimizationScore || 0) - (a.optimizationScore || 0))

    for (const player of remainingPlayers) {
      const position = player.position as keyof typeof positionCounts
      if (positionCounts[position] < positionLimits[position]) {
        optimizedTeam.push(player)
        positionCounts[position]++
        remainingBudget -= player.price

        // Stop if we've reached 18 players
        if (optimizedTeam.length >= 18) break
      }
    }
  }

  return optimizedTeam
}
