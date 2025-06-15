export interface MatchResult {
  season: number
  round: string
  date: string
  homeTeam: string
  homeScore: number
  awayTeam: string
  awayScore: number
  winner: string
  margin: number
}

export async function fetchMatchData(): Promise<MatchResult[]> {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/edflseasoncombined-XkgI8NwZYytkxOY2YLvBqitSPTUf7t.csv",
      { cache: "no-store" }, // Disable caching to ensure fresh data
    )
    const csvText = await response.text()
    return parseMatchCsv(csvText)
  } catch (error) {
    console.error("Error fetching match data:", error)
    return []
  }
}

function parseMatchCsv(csvText: string): MatchResult[] {
  // Split the CSV into lines
  const lines = csvText.split("\n").filter((line) => line.trim() !== "")

  // Skip the header line
  const dataLines = lines.slice(1)

  // Parse each line into a match result object
  return dataLines
    .map((line) => {
      try {
        const fields = line.split(",")

        if (fields.length < 7) {
          console.warn("Invalid match data line:", line)
          return null
        }

        // Parse numeric values safely
        const season = Number.parseInt(fields[0].trim(), 10) || 0
        const round = fields[1].trim()
        const date = fields[2].trim()
        const homeTeam = fields[3].trim()
        const homeScore = Number.parseInt(fields[4].trim(), 10) || 0
        const awayTeam = fields[5].trim()
        const awayScore = Number.parseInt(fields[6].trim(), 10) || 0

        // Don't skip future fixtures with 0-0 scores
        // This allows us to add fixtures for upcoming games

        const winner = homeScore > awayScore ? homeTeam : homeScore < awayScore ? awayTeam : "Draw"
        const margin = Math.abs(homeScore - awayScore)

        return {
          season,
          round,
          date,
          homeTeam,
          homeScore,
          awayTeam,
          awayScore,
          winner,
          margin,
        }
      } catch (error) {
        console.error("Error parsing match data line:", line, error)
        return null
      }
    })
    .filter((match) => match !== null) as MatchResult[]
}

export function getTeamResults(matches: MatchResult[], teamName: string): MatchResult[] {
  if (!matches || !teamName) return []
  return matches.filter((match) => match.homeTeam === teamName || match.awayTeam === teamName)
}

export function getTeamWinLossRecord(
  matches: MatchResult[],
  teamName: string,
): { wins: number; losses: number; draws: number } {
  if (!matches || !teamName) return { wins: 0, losses: 0, draws: 0 }

  let wins = 0
  let losses = 0
  let draws = 0

  matches.forEach((match) => {
    if (match.winner === teamName) {
      wins++
    } else if (match.winner === "Draw") {
      draws++
    } else if (match.homeTeam === teamName || match.awayTeam === teamName) {
      losses++
    }
  })

  return { wins, losses, draws }
}

export function getTeamAverageScore(matches: MatchResult[], teamName: string): number {
  if (!matches || !teamName) return 0

  const teamMatches = getTeamResults(matches, teamName)

  if (teamMatches.length === 0) {
    return 0
  }

  const totalScore = teamMatches.reduce((sum, match) => {
    if (match.homeTeam === teamName) {
      return sum + (match.homeScore || 0)
    } else {
      return sum + (match.awayScore || 0)
    }
  }, 0)

  const average = totalScore / teamMatches.length
  return isNaN(average) ? 0 : Math.round(average)
}

export function getTeamAverageScoreAgainst(matches: MatchResult[], teamName: string): number {
  if (!matches || !teamName) return 0

  const teamMatches = getTeamResults(matches, teamName)

  if (teamMatches.length === 0) {
    return 0
  }

  const totalScoreAgainst = teamMatches.reduce((sum, match) => {
    if (match.homeTeam === teamName) {
      return sum + (match.awayScore || 0)
    } else {
      return sum + (match.homeScore || 0)
    }
  }, 0)

  const average = totalScoreAgainst / teamMatches.length
  return isNaN(average) ? 0 : Math.round(average)
}

export function getTeamForm(matches: MatchResult[], teamName: string, lastN = 5): string[] {
  if (!matches || !teamName) return []

  const teamMatches = getTeamResults(matches, teamName)
    .sort((a, b) => {
      try {
        // Parse dates in format DD/MM/YYYY
        const [aDay, aMonth, aYear] = a.date.split("/").map(Number)
        const [bDay, bMonth, bYear] = b.date.split("/").map(Number)

        // Create date objects (using year, month-1 because JS months are 0-indexed, day)
        const dateA = new Date(aYear, aMonth - 1, aDay)
        const dateB = new Date(bYear, bMonth - 1, bDay)

        // Sort descending (newest first)
        return dateB.getTime() - dateA.getTime()
      } catch (error) {
        console.error("Error sorting dates:", error, a.date, b.date)
        return 0
      }
    })
    .slice(0, lastN)

  return teamMatches.map((match) => {
    if (match.winner === teamName) {
      return "W"
    } else if (match.winner === "Draw") {
      return "D"
    } else {
      return "L"
    }
  })
}

export function getHeadToHead(
  matches: MatchResult[],
  team1: string,
  team2: string,
): { team1Wins: number; team2Wins: number; draws: number } {
  if (!matches || !team1 || !team2) return { team1Wins: 0, team2Wins: 0, draws: 0 }

  const h2hMatches = matches.filter(
    (match) =>
      (match.homeTeam === team1 && match.awayTeam === team2) || (match.homeTeam === team2 && match.awayTeam === team1),
  )

  let team1Wins = 0
  let team2Wins = 0
  let draws = 0

  h2hMatches.forEach((match) => {
    if (match.winner === team1) {
      team1Wins++
    } else if (match.winner === team2) {
      team2Wins++
    } else {
      draws++
    }
  })

  return { team1Wins, team2Wins, draws }
}
