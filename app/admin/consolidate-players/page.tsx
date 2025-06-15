"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Search, Merge } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface PlayerRecord {
  id: string
  name: string
  team: string
  position?: string
  price?: number
  collection: string
  registryId?: string
  playerId?: string
  statsCount: number
}

interface PlayerGroup {
  name: string
  team: string
  records: PlayerRecord[]
  totalStats: number
  suggestedMasterId: string
}

export default function ConsolidatePlayersPage() {
  const [loading, setLoading] = useState(true)
  const [playerGroups, setPlayerGroups] = useState<PlayerGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [consolidating, setConsolidating] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    loadAndGroupPlayers()
  }, [])

  const addDebug = (message: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const loadAndGroupPlayers = async () => {
    setLoading(true)
    setDebugInfo([])
    addDebug("Starting player consolidation analysis...")

    try {
      const allPlayerRecords: PlayerRecord[] = []

      // Load from all possible collections
      const collections = ["players", "fantasyPlayers", "playerRegistry"]

      for (const collectionName of collections) {
        try {
          addDebug(`Loading from ${collectionName} collection...`)
          const snapshot = await getDocs(collection(db, collectionName))

          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data()
            const name = (data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim()).trim()

            if (name && name !== "Unknown Player") {
              // Count stats for this player
              const statsSnapshot = await getDocs(collection(db, "playerStats"))
              const statsCount = statsSnapshot.docs.filter((statDoc) => {
                const statData = statDoc.data()
                return (
                  (statData.playerId === docSnapshot.id ||
                    statData.playerId === data.registryId ||
                    statData.playerId === data.playerId ||
                    (statData.playerName === name && statData.team === (data.team || data.currentTeam))) &&
                  statData.quarter === "All" // Only count total stats
                )
              }).length

              allPlayerRecords.push({
                id: docSnapshot.id,
                name,
                team: data.team || data.currentTeam || "",
                position: data.position || "",
                price: data.price || data.salary || 0,
                collection: collectionName,
                registryId: data.registryId,
                playerId: data.playerId,
                statsCount,
              })
            }
          }

          addDebug(`Found ${snapshot.size} records in ${collectionName}`)
        } catch (error) {
          addDebug(`Error loading ${collectionName}: ${error}`)
        }
      }

      // Group players by name and team
      const groups = new Map<string, PlayerGroup>()

      allPlayerRecords.forEach((record) => {
        const key = `${record.name.toLowerCase()}-${record.team.toLowerCase()}`

        if (!groups.has(key)) {
          groups.set(key, {
            name: record.name,
            team: record.team,
            records: [],
            totalStats: 0,
            suggestedMasterId: "",
          })
        }

        const group = groups.get(key)!
        group.records.push(record)
        group.totalStats += record.statsCount
      })

      // Determine the best master record for each group
      const groupsArray = Array.from(groups.values()).map((group) => {
        // Priority: 1) Most stats, 2) Valid Firebase ID, 3) From 'players' collection
        const bestRecord = group.records.sort((a, b) => {
          // First priority: most stats
          if (a.statsCount !== b.statsCount) return b.statsCount - a.statsCount

          // Second priority: valid Firebase ID (long string, not numeric)
          const aValidId = a.id.length > 10 && isNaN(Number(a.id))
          const bValidId = b.id.length > 10 && isNaN(Number(b.id))
          if (aValidId !== bValidId) return aValidId ? -1 : 1

          // Third priority: from 'players' collection
          if (a.collection === "players" && b.collection !== "players") return -1
          if (b.collection === "players" && a.collection !== "players") return 1

          return 0
        })[0]

        group.suggestedMasterId = bestRecord.id
        return group
      })

      // Only show groups with multiple records or stats issues
      const problematicGroups = groupsArray.filter(
        (group) => group.records.length > 1 || group.totalStats === 0 || group.records.some((r) => r.statsCount === 0),
      )

      setPlayerGroups(problematicGroups)
      addDebug(`Found ${problematicGroups.length} players needing consolidation`)
      addDebug(`Total player records: ${allPlayerRecords.length}`)
    } catch (error) {
      console.error("Error loading players:", error)
      addDebug(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const consolidatePlayer = async (group: PlayerGroup) => {
    addDebug(`Consolidating ${group.name} (${group.team})...`)

    try {
      const masterRecord = group.records.find((r) => r.id === group.suggestedMasterId)!
      const duplicateRecords = group.records.filter((r) => r.id !== group.suggestedMasterId)

      // Update all player stats to point to the master record
      const statsSnapshot = await getDocs(collection(db, "playerStats"))
      const batch = writeBatch(db)
      let statsUpdated = 0

      statsSnapshot.docs.forEach((statDoc) => {
        const statData = statDoc.data()
        const shouldUpdate = group.records.some(
          (record) =>
            statData.playerId === record.id ||
            statData.playerId === record.registryId ||
            statData.playerId === record.playerId ||
            (statData.playerName === group.name && statData.team === group.team),
        )

        if (shouldUpdate && statData.playerId !== masterRecord.id) {
          batch.update(statDoc.ref, {
            playerId: masterRecord.id,
            updatedAt: new Date().toISOString(),
          })
          statsUpdated++
        }
      })

      // Commit stats updates
      if (statsUpdated > 0) {
        await batch.commit()
        addDebug(`Updated ${statsUpdated} stat records to point to master ID`)
      }

      // Delete duplicate player records
      for (const duplicate of duplicateRecords) {
        await deleteDoc(doc(db, duplicate.collection, duplicate.id))
        addDebug(`Deleted duplicate record from ${duplicate.collection}`)
      }

      // Update master record to ensure it has the correct data
      await updateDoc(doc(db, masterRecord.collection, masterRecord.id), {
        registryId: masterRecord.id,
        playerId: masterRecord.id,
        updatedAt: new Date().toISOString(),
      })

      addDebug(`✅ Consolidated ${group.name} - Master ID: ${masterRecord.id}`)
    } catch (error) {
      addDebug(`❌ Error consolidating ${group.name}: ${error}`)
    }
  }

  const consolidateAll = async () => {
    setConsolidating(true)
    addDebug("Starting bulk consolidation...")

    for (const group of playerGroups) {
      await consolidatePlayer(group)
    }

    addDebug("Bulk consolidation complete! Reloading data...")
    await loadAndGroupPlayers()
    setConsolidating(false)
  }

  const filteredGroups = playerGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.team.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Consolidate Players</h1>
            <p className="text-gray-600">One Player = One Firebase ID = All Their Stats</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadAndGroupPlayers} variant="outline" disabled={loading}>
              Refresh Analysis
            </Button>
            <Button
              onClick={consolidateAll}
              disabled={consolidating || playerGroups.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Merge className="h-4 w-4 mr-2" />
              Consolidate All ({playerGroups.length})
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{playerGroups.length}</p>
                <p className="text-sm text-gray-600">Players Needing Consolidation</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {playerGroups.reduce((sum, group) => sum + group.records.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Duplicate Records</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{playerGroups.reduce((sum, group) => sum + group.totalStats, 0)}</p>
                <p className="text-sm text-gray-600">Total Game Stats</p>
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
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 max-h-40 overflow-y-auto">
                  {debugInfo.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Players Needing Consolidation ({filteredGroups.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Analyzing player data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroups.map((group, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <p className="text-gray-600">
                          {group.team} | {group.totalStats} total stats | {group.records.length} records
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="destructive">{group.records.length} Duplicates</Badge>
                        <Button
                          size="sm"
                          onClick={() => consolidatePlayer(group)}
                          disabled={consolidating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Merge className="h-4 w-4 mr-1" />
                          Consolidate
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.records.map((record) => (
                        <div
                          key={record.id}
                          className={`flex items-center justify-between p-2 rounded ${
                            record.id === group.suggestedMasterId ? "bg-green-100 border-green-300" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{record.collection}</Badge>
                            <span className="text-sm">
                              ID: <code className="bg-gray-200 px-1 rounded">{record.id}</code>
                            </span>
                            <span className="text-sm">{record.statsCount} stats</span>
                            {record.registryId && (
                              <span className="text-xs text-gray-500">
                                Registry: {record.registryId.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {record.id === group.suggestedMasterId ? (
                              <Badge variant="default" className="bg-green-600">
                                MASTER
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600">
                                Duplicate
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredGroups.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No players match your search." : "All players are properly consolidated! 🎉"}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
