"use client"

import { useState } from "react"
import { collection, getDocs, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Trash2, RefreshCw, Users, BarChart3 } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { toast } from "@/components/ui/use-toast"

export default function CleanSlatePage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    playerStats: 0,
    players: 0,
    fantasyPlayers: 0,
    playerRegistry: 0,
  })

  const loadStats = async () => {
    setLoading(true)
    try {
      const collections = ["playerStats", "players", "fantasyPlayers", "playerRegistry"]
      const newStats = { ...stats }

      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName))
        newStats[collectionName as keyof typeof stats] = snapshot.size
      }

      setStats(newStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteAllPlayerStats = async () => {
    if (!confirm("Are you sure? This will delete ALL game statistics. This cannot be undone!")) {
      return
    }

    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, "playerStats"))

      // Delete in batches of 500 (Firestore limit)
      const batches = []
      let currentBatch = writeBatch(db)
      let operationCount = 0

      snapshot.docs.forEach((docSnapshot) => {
        currentBatch.delete(docSnapshot.ref)
        operationCount++

        if (operationCount === 500) {
          batches.push(currentBatch)
          currentBatch = writeBatch(db)
          operationCount = 0
        }
      })

      if (operationCount > 0) {
        batches.push(currentBatch)
      }

      // Execute all batches
      for (const batch of batches) {
        await batch.commit()
      }

      toast({
        title: "Success",
        description: `Deleted ${snapshot.size} player statistics records`,
      })

      await loadStats()
    } catch (error) {
      console.error("Error deleting player stats:", error)
      toast({
        title: "Error",
        description: "Failed to delete player statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteAllPlayers = async (collectionName: string) => {
    if (!confirm(`Are you sure? This will delete ALL records from ${collectionName}. This cannot be undone!`)) {
      return
    }

    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, collectionName))

      // Delete in batches
      const batches = []
      let currentBatch = writeBatch(db)
      let operationCount = 0

      snapshot.docs.forEach((docSnapshot) => {
        currentBatch.delete(docSnapshot.ref)
        operationCount++

        if (operationCount === 500) {
          batches.push(currentBatch)
          currentBatch = writeBatch(db)
          operationCount = 0
        }
      })

      if (operationCount > 0) {
        batches.push(currentBatch)
      }

      for (const batch of batches) {
        await batch.commit()
      }

      toast({
        title: "Success",
        description: `Deleted ${snapshot.size} records from ${collectionName}`,
      })

      await loadStats()
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error)
      toast({
        title: "Error",
        description: `Failed to delete ${collectionName}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-red-600">Clean Slate</h1>
            <p className="text-gray-600">Delete data collections to start fresh</p>
          </div>
          <Button onClick={loadStats} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Counts
          </Button>
        </div>

        {/* Warning */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Danger Zone</h3>
                <p className="text-red-700 text-sm">
                  These operations permanently delete data. Make sure you have backups or can re-upload the data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Player Stats</p>
                  <p className="text-2xl font-bold">{stats.playerStats}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Players</p>
                  <p className="text-2xl font-bold">{stats.players}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fantasy Players</p>
                  <p className="text-2xl font-bold">{stats.fantasyPlayers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Player Registry</p>
                  <p className="text-2xl font-bold">{stats.playerRegistry}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Statistics */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <BarChart3 className="h-5 w-5" />
                Game Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Player Stats Collection</p>
                  <p className="text-sm text-gray-600">{stats.playerStats} records</p>
                </div>
                <Badge variant="destructive">{stats.playerStats}</Badge>
              </div>
              <Button
                onClick={deleteAllPlayerStats}
                variant="destructive"
                className="w-full"
                disabled={loading || stats.playerStats === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Game Stats
              </Button>
              <p className="text-xs text-gray-500">
                This will delete all player game statistics. You can re-upload them with proper ID mapping.
              </p>
            </CardContent>
          </Card>

          {/* Player Collections */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Users className="h-5 w-5" />
                Player Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Fantasy Players</p>
                    <p className="text-sm text-gray-600">Legacy collection</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stats.fantasyPlayers}</Badge>
                    <Button
                      onClick={() => deleteAllPlayers("fantasyPlayers")}
                      variant="destructive"
                      size="sm"
                      disabled={loading || stats.fantasyPlayers === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Players</p>
                    <p className="text-sm text-gray-600">Main collection</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stats.players}</Badge>
                    <Button
                      onClick={() => deleteAllPlayers("players")}
                      variant="destructive"
                      size="sm"
                      disabled={loading || stats.players === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Keep Player Registry as your master list. Delete duplicates from other collections.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Process */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Recommended Clean-Up Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span>Keep Player Registry as your master player list</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span>Delete Fantasy Players and Players collections (duplicates)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span>Delete all Player Stats (we'll re-upload with proper mapping)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span>Use the improved stats upload tool with Player Registry mapping</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
