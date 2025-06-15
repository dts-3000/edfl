import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface PlayerRegistry {
  id: string
  playerName: string
  fullName: string // Same as playerName for compatibility
  aliases: string[]
  currentTeam: string
  position: string
  price: number
  active: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

const COLLECTION_NAME = "playerRegistry"

export async function getAllPlayers(): Promise<PlayerRegistry[]> {
  try {
    console.log("Fetching players from playerRegistry collection...")
    const playersRef = collection(db, COLLECTION_NAME)
    const q = query(playersRef, orderBy("playerName", "asc"))
    const snapshot = await getDocs(q)

    const players = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PlayerRegistry[]

    console.log(`Found ${players.length} players in registry`)
    return players
  } catch (error) {
    console.error("Error fetching players from registry:", error)
    return []
  }
}

export async function createPlayer(
  playerData: Omit<PlayerRegistry, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  try {
    const playersRef = collection(db, COLLECTION_NAME)

    // Ensure price is a number, default to 0 if not provided
    const processedData = {
      ...playerData,
      fullName: playerData.playerName, // Set fullName same as playerName for compatibility
      price: typeof playerData.price === "number" ? playerData.price : playerData.price ? Number(playerData.price) : 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(playersRef, processedData)

    console.log("Created player with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creating player:", error)
    throw error
  }
}

export async function updatePlayer(playerId: string, updates: Partial<PlayerRegistry>): Promise<void> {
  try {
    const playerRef = doc(db, COLLECTION_NAME, playerId)

    // Process price if it's being updated
    if (updates.price !== undefined) {
      updates.price = typeof updates.price === "number" ? updates.price : updates.price ? Number(updates.price) : 0
    }

    // Update fullName if playerName is being updated
    if (updates.playerName) {
      updates.fullName = updates.playerName
    }

    await updateDoc(playerRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    console.log("Updated player:", playerId)
  } catch (error) {
    console.error("Error updating player:", error)
    throw error
  }
}

export async function deletePlayer(playerId: string): Promise<void> {
  try {
    const playerRef = doc(db, COLLECTION_NAME, playerId)
    await deleteDoc(playerRef)

    console.log("Deleted player:", playerId)
  } catch (error) {
    console.error("Error deleting player:", error)
    throw error
  }
}

export async function findPlayerByName(name: string): Promise<PlayerRegistry | null> {
  try {
    const playersRef = collection(db, COLLECTION_NAME)
    const q = query(playersRef, where("playerName", "==", name))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as PlayerRegistry
    }

    return null
  } catch (error) {
    console.error("Error finding player by name:", error)
    return null
  }
}

export async function findPlayerByAlias(alias: string): Promise<PlayerRegistry | null> {
  try {
    const playersRef = collection(db, COLLECTION_NAME)
    const q = query(playersRef, where("aliases", "array-contains", alias))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as PlayerRegistry
    }

    return null
  } catch (error) {
    console.error("Error finding player by alias:", error)
    return null
  }
}

export async function generatePlayerIdMapping(): Promise<{ [key: string]: string }> {
  try {
    console.log("Generating player ID mapping...")
    const players = await getAllPlayers()
    const mapping: { [key: string]: string } = {}

    players.forEach((player) => {
      // Add player name mapping (lowercase for matching)
      mapping[player.playerName.toLowerCase()] = player.id

      // Add aliases mapping
      player.aliases.forEach((alias) => {
        mapping[alias.toLowerCase()] = player.id
      })

      // Add fullName mapping for compatibility
      if (player.fullName) {
        mapping[player.fullName.toLowerCase()] = player.id
      }
    })

    console.log(`Generated mapping for ${Object.keys(mapping).length} name variations`)
    return mapping
  } catch (error) {
    console.error("Error generating player ID mapping:", error)
    return {}
  }
}

// Import players from CSV data
export async function importPlayersFromCSV(csvData: any[]): Promise<number> {
  try {
    console.log(`Starting CSV import of ${csvData.length} players...`)
    let importedCount = 0

    for (const row of csvData) {
      // Check if player already exists
      const playerName = row.playerName?.trim()
      if (!playerName) {
        console.log("Skipping row with empty playerName")
        continue
      }

      const existingPlayer = await findPlayerByName(playerName)

      if (existingPlayer) {
        console.log(`Player ${playerName} already exists, skipping...`)
        continue
      }

      // Create new player record
      const playerData = {
        playerName: playerName,
        fullName: playerName, // Set same for compatibility
        aliases: [playerName],
        currentTeam: row.team || "",
        position: row.position || "",
        price: row.price ? Number(row.price) : 0,
        active: true,
      }

      await createPlayer(playerData)
      importedCount++
      console.log(`Imported player: ${playerName} - $${playerData.price}`)
    }

    console.log(`CSV import complete. Imported ${importedCount} new players.`)
    return importedCount
  } catch (error) {
    console.error("Error importing players from CSV:", error)
    throw error
  }
}

export async function importPlayersFromExistingData(fantasyPlayers: any[]): Promise<number> {
  try {
    console.log(`Starting import of ${fantasyPlayers.length} players...`)
    let importedCount = 0

    for (const player of fantasyPlayers) {
      const playerName = player.name || player.fullName || player.playerName
      if (!playerName) continue

      // Check if player already exists
      const existingPlayer = await findPlayerByName(playerName)
      if (existingPlayer) {
        console.log(`Player ${playerName} already exists, skipping...`)
        continue
      }

      // Create new player record
      const playerData = {
        playerName: playerName,
        fullName: playerName,
        aliases: [playerName],
        currentTeam: player.team || "",
        position: player.position || "",
        price: player.price ? Number(player.price) : 0,
        active: true,
      }

      await createPlayer(playerData)
      importedCount++
      console.log(`Imported player: ${playerName}`)
    }

    console.log(`Import complete. Imported ${importedCount} new players.`)
    return importedCount
  } catch (error) {
    console.error("Error importing players:", error)
    throw error
  }
}
