import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Marby (Maribyrnong) Players
const marbyPlayers = [
  { name: "Jake Thompson", position: "Forward" },
  { name: "Michael O'Brien", position: "Midfielder" },
  { name: "Daniel Smith", position: "Defender" },
  { name: "Ryan Wilson", position: "Forward" },
  { name: "Luke Anderson", position: "Midfielder" },
  { name: "James Taylor", position: "Defender" },
  { name: "Connor Brown", position: "Forward" },
  { name: "Matthew Davis", position: "Midfielder" },
  { name: "Nathan Miller", position: "Defender" },
  { name: "Tyler Johnson", position: "Forward" },
  { name: "Cameron White", position: "Midfielder" },
  { name: "Joshua Garcia", position: "Defender" },
  { name: "Brandon Martinez", position: "Forward" },
  { name: "Dylan Rodriguez", position: "Midfielder" },
  { name: "Ethan Lopez", position: "Defender" },
  { name: "Mason Hill", position: "Forward" },
  { name: "Logan Scott", position: "Midfielder" },
  { name: "Hunter Green", position: "Defender" },
  { name: "Blake Adams", position: "Forward" },
  { name: "Caleb Baker", position: "Midfielder" },
  { name: "Owen Clark", position: "Defender" },
  { name: "Liam Lewis", position: "Forward" },
]

// EDS (Essendon Doutta Stars) Players
const edsPlayers = [
  { name: "Alex Walker", position: "Forward" },
  { name: "Sam Hall", position: "Midfielder" },
  { name: "Ben Allen", position: "Defender" },
  { name: "Jack Young", position: "Forward" },
  { name: "Tom King", position: "Midfielder" },
  { name: "Will Wright", position: "Defender" },
  { name: "Noah Lopez", position: "Forward" },
  { name: "Eli Hill", position: "Midfielder" },
  { name: "Max Scott", position: "Defender" },
  { name: "Leo Green", position: "Forward" },
  { name: "Zoe Adams", position: "Midfielder" },
  { name: "Ruby Baker", position: "Defender" },
  { name: "Mia Clark", position: "Forward" },
  { name: "Emma Lewis", position: "Midfielder" },
  { name: "Ava Walker", position: "Defender" },
  { name: "Sophie Hall", position: "Forward" },
  { name: "Chloe Allen", position: "Midfielder" },
  { name: "Grace Young", position: "Defender" },
  { name: "Lily King", position: "Forward" },
  { name: "Ella Wright", position: "Midfielder" },
  { name: "Zara Lopez", position: "Defender" },
  { name: "Maya Hill", position: "Forward" },
]

async function addPlayersToRegistry() {
  try {
    console.log("Starting to add players to registry...")

    // Add Marby players
    console.log("Adding Marby players...")
    for (const player of marbyPlayers) {
      const playerData = {
        playerName: player.name,
        fullName: player.name,
        aliases: [player.name],
        currentTeam: "Marby",
        position: player.position,
        price: Math.floor(Math.random() * 500000) + 200000, // Random price between 200k-700k
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "playerRegistry"), playerData)
      console.log(`Added ${player.name} to Marby with ID: ${docRef.id}`)
    }

    // Add EDS players
    console.log("Adding EDS players...")
    for (const player of edsPlayers) {
      const playerData = {
        playerName: player.name,
        fullName: player.name,
        aliases: [player.name],
        currentTeam: "EDS",
        position: player.position,
        price: Math.floor(Math.random() * 500000) + 200000, // Random price between 200k-700k
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "playerRegistry"), playerData)
      console.log(`Added ${player.name} to EDS with ID: ${docRef.id}`)
    }

    console.log("Successfully added all players!")
    console.log(
      `Total added: ${marbyPlayers.length} Marby players + ${edsPlayers.length} EDS players = ${marbyPlayers.length + edsPlayers.length} players`,
    )
  } catch (error) {
    console.error("Error adding players:", error)
  }
}

// Run the function
addPlayersToRegistry()
