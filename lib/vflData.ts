export interface VFLPlayerStat {
  Date: string
  VFLRound: number
  Player: string
  EDFLClub: string
  VFLClub: string
  G: number // Goals
  B: number // Behinds
  K: number // Kicks
  H: number // Handballs
  M: number // Marks
  T: number // Tackles
  HO: number // Hit Outs
  TotalFP: number // Total Fantasy Points
}

// Function to get the latest uploaded file URL from localStorage
function getStoredVFLDataUrl(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("vflDataUrl")
  }
  return null
}

// Function to set the latest uploaded file URL
export function setLatestVFLDataUrl(url: string) {
  console.log("VFL data source updated to:", url)

  // Store in localStorage for persistence
  if (typeof window !== "undefined") {
    localStorage.setItem("vflDataUrl", url)
  }
}

export async function fetchVFLData(): Promise<VFLPlayerStat[]> {
  try {
    // Use stored URL first, then fall back to default
    const storedUrl = getStoredVFLDataUrl()
    const originalUrl =
      storedUrl || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rnd9-VoHYaaVs8LzOKyigwEBlRWvM2Y9REJ.csv"

    console.log("Fetching VFL data from:", originalUrl)

    // Use our API route to bypass CORS issues
    const apiUrl = `/api/vfl-data?url=${encodeURIComponent(originalUrl)}`
    console.log("Using API route:", apiUrl)

    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch VFL data: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log("CSV Text length:", csvText.length)
    console.log("First 500 characters:", csvText.substring(0, 500))

    // Parse CSV - handle different line endings
    const rows = csvText.split(/\r?\n/)
    console.log("Total rows:", rows.length)

    if (rows.length === 0) {
      console.error("No rows found in CSV")
      return []
    }

    // Detect delimiter - check first row for tabs, commas, or semicolons
    const firstRow = rows[0]
    let delimiter = ","
    if (firstRow.includes("\t")) {
      delimiter = "\t"
      console.log("Detected tab-delimited file")
    } else if (firstRow.includes(";")) {
      delimiter = ";"
      console.log("Detected semicolon-delimited file")
    } else {
      console.log("Detected comma-delimited file")
    }

    const headers = firstRow.split(delimiter).map((h) => h.trim())
    console.log("Headers found:", headers)
    console.log("Using delimiter:", delimiter === "\t" ? "TAB" : delimiter)

    const data: VFLPlayerStat[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) continue

      const values = row.split(delimiter).map((v) => v.trim().replace(/"/g, ""))
      console.log(`Row ${i}:`, values)

      const stat: any = {}

      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        const cleanHeader = header.replace(/\s+/g, "").toLowerCase()

        // Map headers to our interface properties - exact matching for your headers
        if (cleanHeader === "date") {
          stat["Date"] = value
        } else if (cleanHeader === "vflround") {
          stat["VFLRound"] = value ? Number(value) : 0
        } else if (cleanHeader === "player") {
          stat["Player"] = value
        } else if (cleanHeader === "edflclub") {
          stat["EDFLClub"] = value
        } else if (cleanHeader === "vflclub") {
          stat["VFLClub"] = value
        } else if (cleanHeader === "g") {
          stat["G"] = value ? Number(value) : 0
        } else if (cleanHeader === "b") {
          stat["B"] = value ? Number(value) : 0
        } else if (cleanHeader === "k") {
          stat["K"] = value ? Number(value) : 0
        } else if (cleanHeader === "h") {
          stat["H"] = value ? Number(value) : 0
        } else if (cleanHeader === "m") {
          stat["M"] = value ? Number(value) : 0
        } else if (cleanHeader === "t") {
          stat["T"] = value ? Number(value) : 0
        } else if (cleanHeader === "ho") {
          stat["HO"] = value ? Number(value) : 0
        } else if (cleanHeader === "totalfp") {
          stat["TotalFP"] = value ? Number(value) : 0
        }
      })

      console.log(`Parsed stat for row ${i}:`, stat)

      // Only add valid entries - check for required fields
      if (stat.Player && stat.Player.length > 0 && (stat.Date || stat.VFLRound)) {
        data.push(stat as VFLPlayerStat)
        console.log(`Added player: ${stat.Player}`)
      } else {
        console.log(`Skipped row ${i} - missing required fields:`, {
          hasPlayer: !!stat.Player,
          hasDate: !!stat.Date,
          hasRound: !!stat.VFLRound,
        })
      }
    }

    console.log(`Successfully parsed ${data.length} player stats`)
    return data
  } catch (error) {
    console.error("Error fetching VFL data:", error)
    return []
  }
}

export function getUniqueVFLClubs(data: VFLPlayerStat[]): string[] {
  const clubs = new Set<string>()
  data.forEach((stat) => clubs.add(stat.VFLClub))
  return Array.from(clubs).sort()
}

export function getUniqueEDFLClubs(data: VFLPlayerStat[]): string[] {
  const clubs = new Set<string>()
  data.forEach((stat) => clubs.add(stat.EDFLClub))
  return Array.from(clubs).sort()
}

export function getUniquePlayers(data: VFLPlayerStat[]): string[] {
  const players = new Set<string>()
  data.forEach((stat) => players.add(stat.Player))
  return Array.from(players).sort()
}

export function getPlayerStats(data: VFLPlayerStat[], player: string): VFLPlayerStat[] {
  return data.filter((stat) => stat.Player === player).sort((a, b) => a.VFLRound - b.VFLRound)
}

export function getClubStats(data: VFLPlayerStat[], club: string, isVFL = true): VFLPlayerStat[] {
  return isVFL ? data.filter((stat) => stat.VFLClub === club) : data.filter((stat) => stat.EDFLClub === club)
}

export function calculateAverages(stats: VFLPlayerStat[]): {
  avgGoals: number
  avgBehinds: number
  avgKicks: number
  avgHandballs: number
  avgMarks: number
  avgTackles: number
  avgHitOuts: number
  avgFantasyPoints: number
} {
  if (stats.length === 0) {
    return {
      avgGoals: 0,
      avgBehinds: 0,
      avgKicks: 0,
      avgHandballs: 0,
      avgMarks: 0,
      avgTackles: 0,
      avgHitOuts: 0,
      avgFantasyPoints: 0,
    }
  }

  const totals = stats.reduce(
    (acc, stat) => {
      return {
        goals: acc.goals + stat.G,
        behinds: acc.behinds + stat.B,
        kicks: acc.kicks + stat.K,
        handballs: acc.handballs + stat.H,
        marks: acc.marks + stat.M,
        tackles: acc.tackles + stat.T,
        hitOuts: acc.hitOuts + stat.HO,
        fantasyPoints: acc.fantasyPoints + stat.TotalFP,
      }
    },
    {
      goals: 0,
      behinds: 0,
      kicks: 0,
      handballs: 0,
      marks: 0,
      tackles: 0,
      hitOuts: 0,
      fantasyPoints: 0,
    },
  )

  return {
    avgGoals: Number.parseFloat((totals.goals / stats.length).toFixed(1)),
    avgBehinds: Number.parseFloat((totals.behinds / stats.length).toFixed(1)),
    avgKicks: Number.parseFloat((totals.kicks / stats.length).toFixed(1)),
    avgHandballs: Number.parseFloat((totals.handballs / stats.length).toFixed(1)),
    avgMarks: Number.parseFloat((totals.marks / stats.length).toFixed(1)),
    avgTackles: Number.parseFloat((totals.tackles / stats.length).toFixed(1)),
    avgHitOuts: Number.parseFloat((totals.hitOuts / stats.length).toFixed(1)),
    avgFantasyPoints: Number.parseFloat((totals.fantasyPoints / stats.length).toFixed(1)),
  }
}

// Add a function to sort players by total fantasy points
export function getTopPerformers(
  data: VFLPlayerStat[],
  limit = 15,
): {
  player: string
  edflClub: string
  vflClub: string
  totalPoints: number
  gamesPlayed: number
  avgPoints: number
  lastThreeAvg: number
  trend: "up" | "down" | "stable"
}[] {
  // Group by player
  const playerMap = new Map<string, VFLPlayerStat[]>()

  data.forEach((stat) => {
    if (!playerMap.has(stat.Player)) {
      playerMap.set(stat.Player, [])
    }
    playerMap.get(stat.Player)?.push(stat)
  })

  // Calculate totals and averages
  const playerStats = Array.from(playerMap.entries()).map(([player, stats]) => {
    const sortedStats = [...stats].sort((a, b) => a.VFLRound - b.VFLRound)
    const totalPoints = stats.reduce((sum, stat) => sum + stat.TotalFP, 0)
    const gamesPlayed = stats.length
    const avgPoints = Number.parseFloat((totalPoints / gamesPlayed).toFixed(1))

    // Calculate last three games average
    const lastThree = sortedStats.slice(-3)
    const lastThreeTotal = lastThree.reduce((sum, stat) => sum + stat.TotalFP, 0)
    const lastThreeAvg = lastThree.length > 0 ? Number.parseFloat((lastThreeTotal / lastThree.length).toFixed(1)) : 0

    // Determine trend
    let trend: "up" | "down" | "stable" = "stable"
    if (lastThreeAvg > avgPoints + 5) {
      trend = "up"
    } else if (lastThreeAvg < avgPoints - 5) {
      trend = "down"
    }

    return {
      player,
      edflClub: stats[0].EDFLClub,
      vflClub: stats[0].VFLClub,
      totalPoints,
      gamesPlayed,
      avgPoints,
      lastThreeAvg,
      trend,
    }
  })

  // Sort by total points and return top performers
  return playerStats
    .filter((player) => player.gamesPlayed >= 2) // Only include players with at least 2 games
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit)
}

// Get rounds played in the VFL season
export function getVFLRounds(data: VFLPlayerStat[]): number[] {
  const rounds = new Set<number>()
  data.forEach((stat) => rounds.add(stat.VFLRound))
  return Array.from(rounds).sort((a, b) => a - b)
}

// Get player form over the season
export function getPlayerForm(stats: VFLPlayerStat[]): {
  round: number
  points: number
  rolling3: number | null
}[] {
  const sortedStats = [...stats].sort((a, b) => a.VFLRound - b.VFLRound)

  return sortedStats.map((stat, index) => {
    // Calculate 3-game rolling average
    let rolling3 = null
    if (index >= 2) {
      const last3 = sortedStats.slice(index - 2, index + 1)
      const total = last3.reduce((sum, s) => sum + s.TotalFP, 0)
      rolling3 = Number.parseFloat((total / 3).toFixed(1))
    }

    return {
      round: stat.VFLRound,
      points: stat.TotalFP,
      rolling3,
    }
  })
}

// Get player position based on stats
export function getPlayerPosition(stats: VFLPlayerStat[]): string {
  if (stats.length === 0) return "Unknown"

  const averages = calculateAverages(stats)

  // Simple position determination based on stats
  if (averages.avgHitOuts > 5) return "Ruck"
  if (averages.avgGoals > 1.5) return "Forward"
  if (averages.avgTackles > 4) return "Midfielder"
  return "Defender"
}

// Get fantasy recommendation score (0-100)
export function getFantasyRecommendation(player: {
  avgPoints: number
  lastThreeAvg: number
  trend: string
  gamesPlayed: number
}): number {
  let score = 0

  // Base score from average points (max 50)
  score += Math.min(50, player.avgPoints / 2)

  // Recent form bonus (max 30)
  if (player.trend === "up") {
    score += 30
  } else if (player.trend === "stable") {
    score += 15
  }

  // Games played consistency bonus (max 20)
  score += Math.min(20, player.gamesPlayed * 2)

  return Math.round(Math.min(100, score))
}
