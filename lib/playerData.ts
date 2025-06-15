import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore"

// Initialize Firebase
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

export interface Player {
  id: string // This will be the Firebase registry ID
  csvId?: string // Original CSV ID for reference
  registryId: string // Firebase registry ID (same as id)
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
  active?: boolean
  fullName?: string
  currentTeam?: string
  [key: string]: any
}

// Fetch all players from Firebase playerRegistry collection
export async function fetchPlayerData(): Promise<Player[]> {
  try {
    console.log("Fetching players from Firebase playerRegistry...")

    // Get all players from the playerRegistry collection
    const playersSnapshot = await getDocs(collection(db, "playerRegistry"))

    if (playersSnapshot.empty) {
      console.warn("No players found in Firebase playerRegistry!")
      return []
    }

    const players: Player[] = []

    playersSnapshot.docs.forEach((doc) => {
      const data = doc.data()

      // Map Firebase registry data to Player interface
      const player: Player = {
        id: doc.id, // Use Firebase document ID as primary ID
        registryId: doc.id, // Firebase registry ID
        name: data.playerName || data.fullName || "",
        team: data.currentTeam || data.team || "",
        position: data.position || "",
        price: data.price || 0,
        status: data.active === false ? "Inactive" : "Active",
        averageScore: data.averageScore || 0,
        gamesPlayed: data.gamesPlayed || 0,
        lastRoundScore: data.lastRoundScore || 0,
        breakeven: data.breakeven || 0,
        active: data.active !== false,
        fullName: data.fullName || data.playerName || "",
        currentTeam: data.currentTeam || data.team || "",
        // Add any other fields from the registry
        ...data,
      }

      players.push(player)
    })

    console.log(`Successfully loaded ${players.length} players from Firebase playerRegistry`)

    // Sort players by name for consistent display
    players.sort((a, b) => a.name.localeCompare(b.name))

    return players
  } catch (error) {
    console.error("Error fetching player data from Firebase:", error)
    throw new Error("Failed to load player data")
  }
}

// Get a single player by registry ID
export async function getPlayerById(playerId: string): Promise<Player | null> {
  try {
    const playerDoc = await getDoc(doc(db, "playerRegistry", playerId))

    if (!playerDoc.exists()) {
      return null
    }

    const data = playerDoc.data()

    return {
      id: playerDoc.id,
      registryId: playerDoc.id,
      name: data.playerName || data.fullName || "",
      team: data.currentTeam || data.team || "",
      position: data.position || "",
      price: data.price || 0,
      status: data.active === false ? "Inactive" : "Active",
      averageScore: data.averageScore || 0,
      gamesPlayed: data.gamesPlayed || 0,
      lastRoundScore: data.lastRoundScore || 0,
      breakeven: data.breakeven || 0,
      active: data.active !== false,
      fullName: data.fullName || data.playerName || "",
      currentTeam: data.currentTeam || data.team || "",
      ...data,
    }
  } catch (error) {
    console.error("Error fetching player by ID:", error)
    return null
  }
}

// Legacy function for backward compatibility
export async function getPlayers(): Promise<Player[]> {
  return fetchPlayerData()
}
