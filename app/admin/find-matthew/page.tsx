"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function FindMatthewPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const findMatthewHanson = async () => {
    setLoading(true)
    setResults(null)
    setDebugInfo([])

    try {
      addDebug("Searching for Matthew Hanson...")

      // Get all player stats
      const statsRef = collection(db, "playerStats")
      const statsSnapshot = await getDocs(statsRef)
      addDebug(`Loaded ${statsSnapshot.docs.length} stats records`)

      // Find all records that might be Matthew Hanson
      const matthewRecords = []
      const airportWestRecords = []
      const hansonRecords = []

      statsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        const playerName = data.playerName || ""
        const team = data.team || ""

        // Look for Matthew variations
        if (playerName.toLowerCase().includes("matthew") || playerName.toLowerCase().includes("matt")) {
          matthewRecords.push({
            id: doc.id,
            playerName,
            team,
            playerId: data.playerId,
            quarter: data.quarter,
            fantasyPoints: data.fantasyPoints,
          })
        }

        // Look for Airport West players
        if (team.toLowerCase().includes("airport") || team.toLowerCase().includes("west")) {
          airportWestRecords.push({
            id: doc.id,
            playerName,
            team,
            playerId: data.playerId,
            quarter: data.quarter,
            fantasyPoints: data.fantasyPoints,
          })
        }

        // Look for Hanson variations
        if (playerName.toLowerCase().includes("hanson")) {
          hansonRecords.push({
            id: doc.id,
            playerName,
            team,
            playerId: data.playerId,
            quarter: data.quarter,
            fantasyPoints: data.fantasyPoints,
          })
        }
      })

      addDebug(`Found ${matthewRecords.length} records with "Matthew" or "Matt"`)
      addDebug(`Found ${airportWestRecords.length} records with "Airport West"`)
      addDebug(`Found ${hansonRecords.length} records with "Hanson"`)

      // Look for exact combinations
      const matthewAirportWest = matthewRecords.filter(
        (r) => r.team.toLowerCase().includes("airport") || r.team.toLowerCase().includes("west"),
      )
      const hansonAirportWest = hansonRecords.filter(
        (r) => r.team.toLowerCase().includes("airport") || r.team.toLowerCase().includes("west"),
      )

      addDebug(`Found ${matthewAirportWest.length} Matthew + Airport West records`)
      addDebug(`Found ${hansonAirportWest.length} Hanson + Airport West records`)

      // Get unique player names and teams for Airport West
      const uniqueAirportWestPlayers = Array.from(
        new Set(airportWestRecords.map((r) => `${r.playerName} (${r.team})`)),
      ).sort()

      setResults({
        matthewRecords: matthewRecords.slice(0, 20), // Limit to first 20
        airportWestRecords: airportWestRecords.slice(0, 20),
        hansonRecords,
        matthewAirportWest,
        hansonAirportWest,
        uniqueAirportWestPlayers: uniqueAirportWestPlayers.slice(0, 50),
      })

      addDebug("Search completed!")
    } catch (err) {
      addDebug(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const linkMatthewManually = async (playerId: string) => {
    try {
      addDebug(`Manually linking Matthew Hanson to playerId: ${playerId}`)
      await updateDoc(doc(db, "players", "36"), {
        registryId: playerId,
      })
      addDebug("✓ Successfully linked Matthew Hanson!")
    } catch (err) {
      addDebug(`✗ Failed to link: ${err.message}`)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Find Matthew Hanson</h1>
          <p className="text-gray-600 mt-2">Search for Matthew Hanson's stats records with different name variations</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={findMatthewHanson} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Searching..." : "Find Matthew Hanson"}
          </Button>
        </div>

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-40 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Hanson Records */}
            {results.hansonRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Records with "Hanson" ({results.hansonRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Player Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Player ID</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Quarter</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Fantasy Points</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.hansonRecords.map((record, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-4 py-2">{record.playerName}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.team}</td>
                            <td className="border border-gray-300 px-4 py-2 font-mono text-xs">{record.playerId}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.quarter}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.fantasyPoints}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              {record.team.toLowerCase().includes("airport") && (
                                <Button
                                  size="sm"
                                  onClick={() => linkMatthewManually(record.playerId)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Link This
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Matthew + Airport West Records */}
            {results.matthewAirportWest.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Matthew + Airport West Records ({results.matthewAirportWest.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Player Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Player ID</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Quarter</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Fantasy Points</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.matthewAirportWest.map((record, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-4 py-2">{record.playerName}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.team}</td>
                            <td className="border border-gray-300 px-4 py-2 font-mono text-xs">{record.playerId}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.quarter}</td>
                            <td className="border border-gray-300 px-4 py-2">{record.fantasyPoints}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              <Button
                                size="sm"
                                onClick={() => linkMatthewManually(record.playerId)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Link This
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unique Airport West Players */}
            <Card>
              <CardHeader>
                <CardTitle>All Airport West Players ({results.uniqueAirportWestPlayers.length})</CardTitle>
                <CardDescription>Unique player names and teams for Airport West</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {results.uniqueAirportWestPlayers.map((player, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      {player}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
