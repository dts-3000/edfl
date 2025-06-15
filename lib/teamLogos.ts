export function getTeamLogoPath(teamName: string): string {
  if (!teamName || teamName === "TBD") {
    console.log("No team name provided, using placeholder")
    return "/images/teams/placeholder.png"
  }

  // Normalize the team name to handle case differences and variations
  const normalizedTeamName = teamName.toLowerCase().trim()
  console.log(`Looking for logo for team: "${teamName}" (normalized: "${normalizedTeamName}")`)

  // Map of normalized team names to their logo paths
  const teamLogoMap: Record<string, string> = {
    aberfeldie: "/images/teams/aberfeldie.png",
    "airport west": "/images/teams/airport-west.png",
    "avondale heights": "/images/teams/avondale-heights.png",
    "deer park": "/images/teams/deer-park.png",
    "east keilor": "/images/teams/east-keilor.png",
    eds: "/images/teams/eds.png",
    "essendon doutta stars": "/images/teams/eds.png",
    glenroy: "/images/teams/glenroy.png",
    greenvale: "/images/teams/greenvale.png",
    keilor: "/images/teams/keilor.png",
    marby: "/images/teams/marby.png",
    "maribyrnong park": "/images/teams/marby.png",
    "pascoe vale": "/images/teams/pascoe-vale.png",
    strathmore: "/images/teams/strathmore.png",
    "west coburg": "/images/teams/west-coburg.png",
    "northern saints": "/images/teams/northern-saints.png",
    tbd: "/images/teams/placeholder.png",
    "": "/images/teams/placeholder.png",
  }

  // Try to find a direct match
  for (const [key, value] of Object.entries(teamLogoMap)) {
    if (normalizedTeamName === key) {
      console.log(`Found direct match for "${teamName}": ${value}`)
      return value
    }
  }

  // If no direct match, try to find a partial match
  for (const [key, value] of Object.entries(teamLogoMap)) {
    if (normalizedTeamName.includes(key) || key.includes(normalizedTeamName)) {
      console.log(`Found partial match for "${teamName}": ${value}`)
      return value
    }
  }

  // Return a placeholder if no match is found
  console.warn(`No logo found for team: "${teamName}", using placeholder`)
  return "/images/teams/placeholder.png"
}

// Add an alias for backward compatibility
export const getTeamLogo = getTeamLogoPath
