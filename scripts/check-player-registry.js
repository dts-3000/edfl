import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkPlayerRegistry() {
  try {
    console.log("Checking player registry...")

    // Get all players from the registry
    const playersRef = collection(db, "playerRegistry")
    const snapshot = await getDocs(playersRef)

    if (snapshot.empty) {
      console.log("❌ No players found in registry")
      return
    }

    const players = []
    snapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    console.log(`📊 Found ${players.length} total players in registry\n`)

    // Group by team
    const teamGroups = {}
    players.forEach((player) => {
      const team = player.currentTeam || "No Team"
      if (!teamGroups[team]) {
        teamGroups[team] = []
      }
      teamGroups[team].push(player)
    })

    // Show team breakdown
    console.log("🏈 Team Breakdown:")
    Object.keys(teamGroups)
      .sort()
      .forEach((team) => {
        console.log(`   ${team}: ${teamGroups[team].length} players`)
      })

    // Show Marby players specifically
    if (teamGroups["Marby"]) {
      console.log(`\n👥 Marby Players (${teamGroups["Marby"].length}):`)
      teamGroups["Marby"].forEach((player) => {
        console.log(`   • ${player.playerName} (${player.position || "No position"})`)
      })
    } else {
      console.log("\n❌ No players assigned to Marby")
    }

    // Show EDS players specifically
    if (teamGroups["EDS"]) {
      console.log(`\n👥 EDS Players (${teamGroups["EDS"].length}):`)
      teamGroups["EDS"].forEach((player) => {
        console.log(`   • ${player.playerName} (${player.position || "No position"})`)
      })
    } else {
      console.log("\n❌ No players assigned to EDS")
    }

    // Show sample of unassigned players
    const unassigned = teamGroups["No Team"] || teamGroups[""] || []
    if (unassigned.length > 0) {
      console.log(`\n🔄 Sample Unassigned Players (showing first 10 of ${unassigned.length}):`)
      unassigned.slice(0, 10).forEach((player) => {
        console.log(`   • ${player.playerName} (${player.position || "No position"})`)
      })
    }
  } catch (error) {
    console.error("❌ Error checking registry:", error)
  }
}

// Run the check
checkPlayerRegistry()
