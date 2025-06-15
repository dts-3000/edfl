import { NextResponse } from "next/server"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function GET() {
  try {
    // Get all players with numeric IDs
    const playersRef = collection(db, "players")
    const playersSnapshot = await getDocs(playersRef)

    const numericIdPlayers = playersSnapshot.docs.filter((doc) => /^\d+$/.test(doc.id))

    console.log(`Found ${numericIdPlayers.length} players with numeric IDs`)

    // Get all players from registry for matching
    const registryPlayers = playersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Update each player with numeric ID
    let updated = 0
    let failed = 0
    const results = []

    for (const playerDoc of numericIdPlayers) {
      const playerData = playerDoc.data()
      const playerName = playerData.name || ""
      const playerTeam = playerData.team || ""

      // Skip if no name
      if (!playerName) {
        failed++
        results.push({
          id: playerDoc.id,
          name: "Unknown",
          team: playerTeam,
          status: "no-name",
        })
        continue
      }

      // Find matching player in registry by name and team
      const matchingPlayer = registryPlayers.find(
        (p) => p.name && p.team && p.name === playerName && p.team === playerTeam && !/^\d+$/.test(p.id), // Ensure it's not another numeric ID
      )

      if (matchingPlayer) {
        try {
          // Update player with registryId
          await updateDoc(doc(db, "players", playerDoc.id), {
            registryId: matchingPlayer.id,
          })

          updated++
          results.push({
            id: playerDoc.id,
            name: playerName,
            team: playerTeam,
            registryId: matchingPlayer.id,
            status: "updated",
          })
        } catch (error) {
          failed++
          results.push({
            id: playerDoc.id,
            name: playerName,
            team: playerTeam,
            error: error.message,
            status: "failed",
          })
        }
      } else {
        // If no exact match, try fuzzy match by name only
        const fuzzyMatch = registryPlayers.find((p) => {
          if (!p.name || !playerName) return false
          const pName = p.name.toLowerCase()
          const searchName = playerName.toLowerCase()
          return pName.includes(searchName) || searchName.includes(pName)
        })

        if (fuzzyMatch) {
          try {
            await updateDoc(doc(db, "players", playerDoc.id), {
              registryId: fuzzyMatch.id,
            })

            updated++
            results.push({
              id: playerDoc.id,
              name: playerName,
              team: playerTeam,
              registryId: fuzzyMatch.id,
              status: "updated-fuzzy",
            })
          } catch (error) {
            failed++
            results.push({
              id: playerDoc.id,
              name: playerName,
              team: playerTeam,
              error: error.message,
              status: "failed",
            })
          }
        } else {
          failed++
          results.push({
            id: playerDoc.id,
            name: playerName,
            team: playerTeam,
            status: "no-match",
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: numericIdPlayers.length,
      updated,
      failed,
      results,
    })
  } catch (error) {
    console.error("Error fixing player IDs:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
