export interface Player {
  id: string
  name: string
  team: string
  position: string
  price: number
  points?: number
  selected?: boolean
  averageScore?: number
  status?: string
  lastRoundScore?: number
  rollingAvg3?: number
  breakeven?: number
  gamesPlayed?: number
  roundScores?: number[]
  vflAvg?: number
  adjAvg?: number
  expectedPrice?: number
  priceChange?: number
  roundUpdated?: number
  [key: string]: any // Allow for dynamic properties
}

export interface TeamData {
  teamName: string
  teamMotto?: string
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
  players: Player[]
  captain?: string
  viceCaptain?: string
  budget: number
  lastUpdated: number
}

// Default team data with updated salary cap
export const defaultTeamData: TeamData = {
  teamName: "My EDFL Team",
  players: [],
  budget: 6830000, // Updated salary cap
  lastUpdated: Date.now(),
}

// Load team data from localStorage
export async function loadTeamData(): Promise<TeamData> {
  if (typeof window === "undefined") {
    return defaultTeamData
  }

  try {
    const savedTeam = localStorage.getItem("fantasyTeam")
    if (savedTeam) {
      const parsedTeam = JSON.parse(savedTeam)

      // Update budget to 6830000 if it's at any old value
      if (parsedTeam.budget !== 6830000) {
        parsedTeam.budget = 6830000
        localStorage.setItem("fantasyTeam", JSON.stringify(parsedTeam))
        console.log("Updated saved team budget from", parsedTeam.budget, "to 6830000")
      }

      return parsedTeam
    }
  } catch (error) {
    console.error("Error loading team data:", error)
  }

  return defaultTeamData
}

// Save team data to localStorage
export async function saveTeamData(teamData: TeamData): Promise<boolean> {
  if (typeof window === "undefined") {
    return false
  }

  try {
    // Ensure budget is set to 6830000
    const dataToSave = {
      ...teamData,
      budget: 6830000, // Force the budget to be 6830000
      lastUpdated: Date.now(),
    }

    localStorage.setItem("fantasyTeam", JSON.stringify(dataToSave))
    return true
  } catch (error) {
    console.error("Error saving team data:", error)
    return false
  }
}

// Mock implementation for getPlayers - this will be replaced by fetchPlayerData
export async function getPlayers(): Promise<Player[]> {
  // This is just a fallback
  return []
}
