"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, Search, Copy, Check } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface PlayerWithId {
  name: string
  team: string
  position?: string
  currentId: string
  firebaseId: string
  source: string
  isValidFirebaseId: boolean
}

export default function PlayerIdListPage() {
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<PlayerWithId[]>([])
  const [registryPlayers, setRegistryPlayers] = useState<PlayerWithId[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadAllPlayerData()
  }, [])

  const loadAllPlayerData = async () => {
    setLoading(true)

    try {
      const allPlayers: PlayerWithId[] = []
      const allRegistry: PlayerWithId[] = []

      // Load from main players collection
      try {
        const playersSnapshot = await getDocs(collection(db, "players"))
        playersSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const name = data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim()
          const currentId = data.registryId || data.playerId || data.id || ""

          allPlayers.push({
            name,
            team: data.team || data.currentTeam || "",
            position: data.position || "",
            currentId,
            firebaseId: doc.id,
            source: "players",
            isValidFirebaseId: doc.id.length > 10 && isNaN(Number(doc.id)),
          })
        })
      } catch (error) {
        console.error("Error loading players:", error)
      }

      // Load from fantasy players collection (if it exists)
      try {
        const fantasySnapshot = await getDocs(collection(db, "fantasyPlayers"))
        fantasySnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const name = data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim()
          const currentId = data.registryId || data.playerId || data.id || ""

          allPlayers.push({
            name,
            team: data.team || data.currentTeam || "",
            position: data.position || "",
            currentId,
            firebaseId: doc.id,
            source: "fantasyPlayers",
            isValidFirebaseId: doc.id.length > 10 && isNaN(Number(doc.id)),
          })
        })
      } catch (error) {
        console.log("No fantasyPlayers collection found")
      }

      // Load from player registry collection
      try {
        const registrySnapshot = await getDocs(collection(db, "playerRegistry"))
        registrySnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const name = data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim()

          allRegistry.push({
            name,
            team: data.team || data.currentTeam || "",
            position: data.position || "",
            currentId: doc.id,
            firebaseId: doc.id,
            source: "playerRegistry",
            isValidFirebaseId: true,
          })
        })
      } catch (error) {
        console.log("No playerRegistry collection found")
      }

      setPlayers(allPlayers)
      setRegistryPlayers(allRegistry)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(text)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      "Player Name,Team,Position,Current ID,Firebase Document ID,Collection,Valid Firebase ID",
      ...players.map(
        (player) =>
          `"${player.name}","${player.team}","${player.position}","${player.currentId}","${player.firebaseId}","${player.source}","${player.isValidFirebaseId}"`,
      ),
      "",
      "Registry Players:",
      "Player Name,Team,Position,Firebase Document ID,Collection",
      ...registryPlayers.map(
        (player) => `"${player.name}","${player.team}","${player.position}","${player.firebaseId}","${player.source}"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "player-firebase-ids.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.firebaseId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredRegistry = registryPlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.firebaseId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Player Firebase IDs List</h1>
            <p className="text-gray-600">Complete list of all players and their Firebase document IDs</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadAllPlayerData} variant="outline" disabled={loading}>
              Refresh Data
            </Button>
            <Button onClick={exportToCSV} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{players.length}</p>
                <p className="text-sm text-gray-600">Total Players</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{players.filter((p) => !p.isValidFirebaseId).length}</p>
                <p className="text-sm text-gray-600">Invalid Firebase IDs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{registryPlayers.length}</p>
                <p className="text-sm text-gray-600">Registry Players</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, team, or Firebase ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading player data...</p>
          </div>
        ) : (
          <>
            {/* Main Players */}
            <Card>
              <CardHeader>
                <CardTitle>Main Players ({filteredPlayers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredPlayers.map((player, index) => (
                    <div
                      key={`${player.firebaseId}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{player.name}</span>
                          <Badge variant="outline">{player.team}</Badge>
                          {player.position && <Badge variant="secondary">{player.position}</Badge>}
                          <Badge variant={player.isValidFirebaseId ? "default" : "destructive"}>{player.source}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>
                            Current ID: <code className="bg-gray-200 px-1 rounded">{player.currentId || "None"}</code>
                          </div>
                          <div>
                            Firebase ID: <code className="bg-blue-100 px-1 rounded">{player.firebaseId}</code>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(player.firebaseId)}>
                          {copiedId === player.firebaseId ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {!player.isValidFirebaseId && <Badge variant="destructive">Invalid ID</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Registry Players */}
            <Card>
              <CardHeader>
                <CardTitle>Registry Players ({filteredRegistry.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredRegistry.map((player, index) => (
                    <div
                      key={`${player.firebaseId}-reg-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{player.name}</span>
                          <Badge variant="outline">{player.team}</Badge>
                          {player.position && <Badge variant="secondary">{player.position}</Badge>}
                          <Badge variant="default" className="bg-green-600">
                            {player.source}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>
                            Firebase ID: <code className="bg-green-100 px-1 rounded">{player.firebaseId}</code>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(player.firebaseId)}>
                          {copiedId === player.firebaseId ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Badge variant="default" className="bg-green-600">
                          Valid
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
