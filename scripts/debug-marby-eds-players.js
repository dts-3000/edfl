import { collection, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"

async function debugTeamPlayers() {
  console.log("Debugging Marby and EDS player assignments...")

  // Check exact team names in the TEAMS array
  const TEAMS = [
    "Aberfeldie",
    "Airport West",
    "Avondale Heights",
    "Deer Park",
    "East Keilor",
    "EDS",
    "Glenroy",
    "Greenvale",
    "Keilor",
    "Marby",
    "Pascoe Vale",
    "Strathmore",
  ]

  console.log("Team names in TEAMS array:")
  console.log(TEAMS)

  // Get all players
  const playersRef = collection(db, "playerRegistry")
  const snapshot = await getDocs(playersRef)
  const allPlayers = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  console.log(`Total players in registry: ${allPlayers.length}`)

  // Check for Marby players
  const marbyPlayers = allPlayers.filter(
    (player) =>
      player.currentTeam &&
      (player.currentTeam === "Marby" ||
        player.currentTeam.toLowerCase() === "marby" ||
        player.currentTeam.includes("Marby") ||
        player.currentTeam.includes("aribyrnong")),
  )

  console.log(`Players with Marby team assignment: ${marbyPlayers.length}`)
  if (marbyPlayers.length > 0) {
    console.log("Sample Marby players:")
    marbyPlayers.slice(0, 5).forEach((player) => {
      console.log(`- ${player.playerName} (Team: "${player.currentTeam}")`)
    })
  }

  // Check for EDS players
  const edsPlayers = allPlayers.filter(
    (player) =>
      player.currentTeam &&
      (player.currentTeam === "EDS" ||
        player.currentTeam.toLowerCase() === "eds" ||
        player.currentTeam.includes("EDS") ||
        player.currentTeam.includes("Essendon") ||
        player.currentTeam.includes("Doutta")),
  )

  console.log(`Players with EDS team assignment: ${edsPlayers.length}`)
  if (edsPlayers.length > 0) {
    console.log("Sample EDS players:")
    edsPlayers.slice(0, 5).forEach((player) => {
      console.log(`- ${player.playerName} (Team: "${player.currentTeam}")`)
    })
  }

  // Check for team name variations
  const teamCounts = {}
  allPlayers.forEach((player) => {
    if (player.currentTeam) {
      if (!teamCounts[player.currentTeam]) {
        teamCounts[player.currentTeam] = 0
      }
      teamCounts[player.currentTeam]++
    }
  })

  console.log("All team names found in player registry:")
  Object.entries(teamCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([team, count]) => {
      console.log(`- "${team}": ${count} players`)
    })

  // Check if there's a mismatch between registry team names and TEAMS array
  const mismatchedTeams = Object.keys(teamCounts).filter((team) => !TEAMS.includes(team))
  if (mismatchedTeams.length > 0) {
    console.log("\nPossible team name mismatches:")
    mismatchedTeams.forEach((team) => {
      console.log(`- "${team}" in registry but not in TEAMS array`)
    })
  }

  return {
    totalPlayers: allPlayers.length,
    marbyPlayers,
    edsPlayers,
    teamCounts,
    mismatchedTeams,
  }
}

// Run the debug function
debugTeamPlayers()
  .then((results) => {
    console.log("\nDebug complete!")
  })
  .catch((error) => {
    console.error("Error during debugging:", error)
  })
