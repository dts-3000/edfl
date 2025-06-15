import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore"
import { generatePlayerIdMapping, findPlayerByName } from "@/lib/playerRegistry"

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

export interface PlayerStat {
  id?: string
  season: string
  round: string
  team: string
  playerNumber: string
  playerName: string
  playerId?: string
  quarter: string
  kicks: number
  handballs: number
  marks: number
  tackles: number
  hitOuts: number
  goals: number
  behinds: number
  fantasyPoints: number
  matchId: string
  createdAt?: any
  updatedAt?: any
}

export interface MatchData {
  id: string
  season: string | number
  round: string
  homeTeam: string
  awayTeam: string
  date: string
  venue?: string
  hasStats?: boolean
  homeScore?: number
  awayScore?: number
  winner?: string
  margin?: number
  createdAt?: any
  updatedAt?: any
}

// Parse CSV data with player ID mapping
export function parseStatsCsv(csvText: string, playerIdMapping: Record<string, string> = {}): PlayerStat[] {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "")
  const headers = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim())

  // Find the index of each required column
  const seasonIndex = headers.findIndex((h) => h === "season")
  const roundIndex = headers.findIndex((h) => h === "round")
  const teamIndex = headers.findIndex((h) => h === "team")
  const playerNumberIndex = headers.findIndex((h) => h === "player number")
  const playerNameIndex = headers.findIndex((h) => h === "player name")
  const quarterIndex = headers.findIndex((h) => h === "quarter")
  const kicksIndex = headers.findIndex((h) => h === "kicks")
  const handballsIndex = headers.findIndex((h) => h === "handballs")
  const marksIndex = headers.findIndex((h) => h === "marks")
  const tacklesIndex = headers.findIndex((h) => h === "tackles")
  const hitOutsIndex = headers.findIndex((h) => h === "hit outs")
  const goalsIndex = headers.findIndex((h) => h === "goals")
  const behindsIndex = headers.findIndex((h) => h === "behinds")
  const fantasyPointsIndex = headers.findIndex((h) => h === "fantasy points" || h === "fp" || h === "fantasypoints")
  const matchIdIndex = headers.findIndex((h) => h === "matchid" || h === "match id")
  const playerIdIndex = headers.findIndex((h) => h === "playerid" || h === "player id")

  const stats: PlayerStat[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())

    if (
      values.length <
      Math.max(
        seasonIndex,
        roundIndex,
        teamIndex,
        playerNumberIndex,
        playerNameIndex,
        quarterIndex,
        kicksIndex,
        handballsIndex,
        marksIndex,
        tacklesIndex,
        hitOutsIndex,
        goalsIndex,
        behindsIndex,
        fantasyPointsIndex,
      ) +
        1
    ) {
      console.warn(`Skipping invalid line: ${lines[i]}`)
      continue
    }

    // Clean up player name (remove special characters)
    const rawPlayerName = values[playerNameIndex]
    const cleanPlayerName = rawPlayerName
      .replace(/[^\w\s]/g, " ") // Replace special chars with space
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()

    // Parse quarter value - could be number or "All"
    let quarterValue = values[quarterIndex]
    if (quarterValue.toLowerCase() === "all") {
      quarterValue = "All"
    }

    // Get player ID from mapping if available
    let playerId: string | undefined

    // First check if player ID is in the CSV
    if (playerIdIndex >= 0 && values[playerIdIndex]) {
      playerId = values[playerIdIndex]
    }
    // Then try to get from mapping
    else if (playerIdMapping && cleanPlayerName) {
      playerId = playerIdMapping[cleanPlayerName.toLowerCase()]
    }

    const stat: PlayerStat = {
      season: values[seasonIndex],
      round: values[roundIndex],
      team: values[teamIndex],
      playerNumber: values[playerNumberIndex],
      playerName: cleanPlayerName,
      playerId, // Add player ID
      quarter: quarterValue,
      kicks: Number.parseInt(values[kicksIndex]) || 0,
      handballs: Number.parseInt(values[handballsIndex]) || 0,
      marks: Number.parseInt(values[marksIndex]) || 0,
      tackles: Number.parseInt(values[tacklesIndex]) || 0,
      hitOuts: Number.parseInt(values[hitOutsIndex]) || 0,
      goals: Number.parseInt(values[goalsIndex]) || 0,
      behinds: Number.parseInt(values[behindsIndex]) || 0,
      fantasyPoints: Number.parseInt(values[fantasyPointsIndex]) || 0,
      matchId:
        matchIdIndex >= 0 && values[matchIdIndex]
          ? values[matchIdIndex]
          : `${values[seasonIndex]}-${values[roundIndex]}-${values[teamIndex]}`,
    }

    stats.push(stat)
  }

  return stats
}

// Save match data to Firestore
export async function saveMatchData(matchData: Omit<MatchData, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    console.log("Saving match data:", matchData)
    const matchesCollection = collection(db, "matches")
    const newMatchRef = doc(matchesCollection)

    const matchWithId: MatchData = {
      ...matchData,
      id: newMatchRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(newMatchRef, matchWithId)
    console.log("Match saved with ID:", newMatchRef.id)

    return newMatchRef.id
  } catch (error) {
    console.error("Error saving match data:", error)
    throw error
  }
}

// Save player stats to Firestore
export async function savePlayerStats(stats: PlayerStat[], matchId: string): Promise<void> {
  try {
    console.log(`Saving ${stats.length} player stats for match ${matchId}`)
    const statsCollection = collection(db, "playerStats")

    // Create a batch for efficient writing
    const batch = writeBatch(db)

    stats.forEach((stat) => {
      const statRef = doc(statsCollection)
      batch.set(statRef, {
        ...stat,
        id: statRef.id,
        matchId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
    console.log("Player stats saved successfully")

    // Update match to indicate it has stats
    const matchRef = doc(db, "matches", matchId)
    await updateDoc(matchRef, {
      hasStats: true,
      updatedAt: serverTimestamp(),
    })
    console.log("Match updated with hasStats: true")
  } catch (error) {
    console.error("Error saving player stats:", error)
    throw error
  }
}

// Get matches
export async function getMatches(): Promise<MatchData[]> {
  try {
    console.log("Getting matches from Firestore...")
    const matchesSnapshot = await getDocs(collection(db, "matches"))
    console.log(`Found ${matchesSnapshot.docs.length} match documents`)

    const matches = matchesSnapshot.docs.map((doc) => {
      const data = doc.data()
      const id = doc.id

      // Normalize the data to ensure consistent structure
      const normalizedData: MatchData = {
        id: id,
        season: data.season?.toString() || "",
        round: data.round?.toString() || "",
        homeTeam: data.homeTeam || "",
        awayTeam: data.awayTeam || "",
        date: data.date || "",
        venue: data.venue || "",
        hasStats: data.hasStats || false,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        winner: data.winner,
        margin: data.margin,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }

      console.log("Normalized match data:", normalizedData)
      return normalizedData
    })

    console.log("Returning matches:", matches)
    return matches
  } catch (error) {
    console.error("Error getting matches:", error)
    return []
  }
}

// Get player stats for a match
export async function getPlayerStatsForMatch(matchId: string): Promise<PlayerStat[]> {
  try {
    const statsQuery = query(collection(db, "playerStats"), where("matchId", "==", matchId))
    const statsSnapshot = await getDocs(statsQuery)
    return statsSnapshot.docs.map((doc) => doc.data() as PlayerStat)
  } catch (error) {
    console.error("Error getting player stats for match:", error)
    return []
  }
}

// Delete a match and its stats
export async function deleteMatchAndStats(matchId: string): Promise<void> {
  try {
    // Delete match
    await deleteDoc(doc(db, "matches", matchId))

    // Delete all stats for the match
    const statsQuery = query(collection(db, "playerStats"), where("matchId", "==", matchId))
    const statsSnapshot = await getDocs(statsQuery)

    const batch = writeBatch(db)
    statsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
  } catch (error) {
    console.error("Error deleting match and stats:", error)
    throw error
  }
}

// Update player stats with player IDs
export async function updatePlayerStatsWithIds(): Promise<number> {
  try {
    // Get player ID mapping
    const playerIdMapping = await generatePlayerIdMapping()

    // Get all matches
    const matches = await getMatches()
    let updatedMatches = 0

    // Process each match
    for (const match of matches) {
      if (match.hasStats) {
        // Get stats for this match
        const statsQuery = query(collection(db, "playerStats"), where("matchId", "==", match.id))
        const statsSnapshot = await getDocs(statsQuery)

        // Skip if no stats
        if (statsSnapshot.empty) continue

        // Create a batch for updates
        const batch = writeBatch(db)
        let updatesInBatch = 0

        // Process each stat
        for (const statDoc of statsSnapshot.docs) {
          const stat = statDoc.data() as PlayerStat

          // Skip if already has player ID
          if (stat.playerId) continue

          // Try to find player ID from mapping
          let playerId = playerIdMapping[stat.playerName.toLowerCase()]

          // If not found in mapping, try to find by name
          if (!playerId) {
            const player = await findPlayerByName(stat.playerName)
            if (player) {
              playerId = player.id
            }
          }

          // Update stat if player ID found
          if (playerId) {
            batch.update(statDoc.ref, {
              playerId,
              updatedAt: serverTimestamp(),
            })
            updatesInBatch++
          }
        }

        // Commit batch if there are updates
        if (updatesInBatch > 0) {
          await batch.commit()
          updatedMatches++
        }
      }
    }

    return updatedMatches
  } catch (error) {
    console.error("Error updating player stats with IDs:", error)
    throw error
  }
}
