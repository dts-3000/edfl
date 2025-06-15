import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore"

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

async function assignPlayersToMarbyAndEDS() {
  try {
    console.log("Fetching existing players from registry...")

    // Get all players from the registry
    const playersRef = collection(db, "playerRegistry")
    const snapshot = await getDocs(playersRef)

    if (snapshot.empty) {
      console.log("No players found in registry")
      return
    }

    const players = []
    snapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    console.log(`Found ${players.length} players in registry`)

    // Filter players that don't have a team or have a generic team
    const unassignedPlayers = players.filter(
      (player) =>
        !player.currentTeam ||
        player.currentTeam === "" ||
        player.currentTeam === "TBD" ||
        player.currentTeam === "Unassigned",
    )

    console.log(`Found ${unassignedPlayers.length} unassigned players`)

    if (unassignedPlayers.length < 44) {
      console.log("Not enough unassigned players, will use some assigned players too")
      // If not enough unassigned, take some from other teams
      const additionalPlayers = players
        .filter((player) => player.currentTeam && player.currentTeam !== "Marby" && player.currentTeam !== "EDS")
        .slice(0, 44 - unassignedPlayers.length)

      unassignedPlayers.push(...additionalPlayers)
    }

    // Take first 22 for Marby, next 22 for EDS
    const marbyPlayers = unassignedPlayers.slice(0, 22)
    const edsPlayers = unassignedPlayers.slice(22, 44)

    console.log(`Assigning ${marbyPlayers.length} players to Marby`)
    console.log(`Assigning ${edsPlayers.length} players to EDS`)

    // Update Marby players
    for (const player of marbyPlayers) {
      const playerRef = doc(db, "playerRegistry", player.id)
      await updateDoc(playerRef, {
        currentTeam: "Marby",
        updatedAt: new Date(),
      })
      console.log(`✓ Assigned ${player.playerName} to Marby`)
    }

    // Update EDS players
    for (const player of edsPlayers) {
      const playerRef = doc(db, "playerRegistry", player.id)
      await updateDoc(playerRef, {
        currentTeam: "EDS",
        updatedAt: new Date(),
      })
      console.log(`✓ Assigned ${player.playerName} to EDS`)
    }

    console.log("\n🎉 Successfully assigned players to teams!")
    console.log(`📊 Summary:`)
    console.log(`   • Marby: ${marbyPlayers.length} players`)
    console.log(`   • EDS: ${edsPlayers.length} players`)
    console.log(`   • Total: ${marbyPlayers.length + edsPlayers.length} players assigned`)
  } catch (error) {
    console.error("❌ Error assigning players:", error)
  }
}

// Run the assignment
assignPlayersToMarbyAndEDS()
