"use client"

import { useState } from "react"
import { collection, getDocs, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, RefreshCw, Users, BarChart3, Database } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { toast } from "@/components/ui/use-toast"

export default function NuclearResetPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    players: 0,
    playerRegistry: 0,
    fantasyPlayers: 0,
    playerStats: 0,
  })

  const loadStats = async () => {
    setLoading(true)
    try {
      const collections = ["players", "playerRegistry", "fantasyPlayers", "playerStats"]
      const newStats = { ...stats }

      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName))
          newStats[collectionName as keyof typeof stats] = snapshot.size
        } catch (error) {
          console.log(`Collection ${collectionName} doesn't exist or is empty`)
          newStats[collectionName as keyof typeof stats] = 0
        }
      }

      setStats(newStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCollection = async (collectionName: string) => {
    if (!confirm(`Are you sure? This will delete ALL ${collectionName}. This cannot be undone!`)) {
      return
    }

    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, collectionName))

      if (snapshot.empty) {
        toast({
          title: "Collection Empty",
          description: `${collectionName} is already empty`,
        })
        return
      }

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

  const nuclearReset = async () => {
    if (!confirm("NUCLEAR RESET: This will delete ALL player data and stats. Are you absolutely sure?")) {
      return
    }

    if (!confirm("This is your final warning. ALL player data will be permanently deleted. Continue?")) {
      return
    }

    setLoading(true)
    try {
      const collections = ["players", "playerRegistry", "fantasyPlayers", "playerStats"]
      let totalDeleted = 0

      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName))

          if (!snapshot.empty) {
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

            totalDeleted += snapshot.size
            console.log(`Deleted ${snapshot.size} records from ${collectionName}`)
          }
        } catch (error) {
          console.log(`Collection ${collectionName} doesn't exist or is empty`)
        }
      }

      toast({
        title: "Nuclear Reset Complete",
        description: `Deleted ${totalDeleted} total records across all collections`,
      })

      await loadStats()
    } catch (error) {
      console.error("Error during nuclear reset:", error)
      toast({
        title: "Error",
        description: "Nuclear reset failed",
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
            <h1 className="text-3xl font-bold text-red-600">☢️ Nuclear Reset</h1>
            <p className="text-gray-600">Delete ALL player data and start completely fresh</p>
          </div>
          <Button onClick={loadStats} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Counts
          </Button>
        </div>

        {/* Warning */}
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800">⚠️ DANGER ZONE ⚠️</h3>
                <p className="text-red-700">
                  This will permanently delete ALL player data from ALL collections. Make sure you have your new CSV
                  ready before proceeding!
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
                  <p className="text-sm text-gray-600">Players</p>
                  <p className="text-2xl font-bold">{stats.players}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
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
                <Database className="h-8 w-8 text-green-600" />
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
                  <p className="text-sm text-gray-600">Player Stats</p>
                  <p className="text-2xl font-bold">{stats.playerStats}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Delete Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-700">Individual Collections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  onClick={() => deleteCollection("players")}
                  variant="destructive"
                  className="w-full"
                  disabled={loading || stats.players === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Players ({stats.players})
                </Button>

                <Button
                  onClick={() => deleteCollection("playerRegistry")}
                  variant="destructive"
                  className="w-full"
                  disabled={loading || stats.playerRegistry === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Player Registry ({stats.playerRegistry})
                </Button>

                <Button
                  onClick={() => deleteCollection("fantasyPlayers")}
                  variant="destructive"
                  className="w-full"
                  disabled={loading || stats.fantasyPlayers === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Fantasy Players ({stats.fantasyPlayers})
                </Button>

                <Button
                  onClick={() => deleteCollection("playerStats")}
                  variant="destructive"
                  className="w-full"
                  disabled={loading || stats.playerStats === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Player Stats ({stats.playerStats})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Nuclear Option */}
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-red-700">☢️ Nuclear Option</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Delete everything at once</p>
                <Button
                  onClick={nuclearReset}
                  variant="destructive"
                  size="lg"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  ☢️ NUCLEAR RESET ☢️
                </Button>
              </div>
              <p className="text-xs text-red-600 text-center">This will delete ALL player data from ALL collections</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">📋 After Nuclear Reset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span>Create your new CSV with proper player names and teams</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span>Upload the CSV to create new PlayerIDs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span>Format game stats CSV to match the new PlayerIDs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span>Upload game stats with proper ID mapping</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
