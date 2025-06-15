"use client"

import { useState } from "react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CollectionScan {
  name: string
  totalDocs: number
  numericIdDocs: number
  sampleDocs: any[]
}

interface FixResult {
  collection: string
  updated: number
  failed: number
  errors: string[]
}

export default function ComprehensiveIdFixPage() {
  const [scanning, setScanning] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [scanResults, setScanResults] = useState<CollectionScan[]>([])
  const [fixResults, setFixResults] = useState<FixResult[]>([])
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const scanAllCollections = async () => {
    setScanning(true)
    setScanResults([])
    setDebugInfo([])

    try {
      addDebug("Starting comprehensive scan of all collections...")

      const collectionsToScan = [
        "players",
        "fantasyPlayers",
        "teamPlayers",
        "userTeams",
        "playerRegistry",
        "playerStats",
        "gameStats",
        "matches",
        "teams",
      ]

      const results: CollectionScan[] = []

      for (const collectionName of collectionsToScan) {
        try {
          addDebug(`Scanning ${collectionName} collection...`)

          const collectionRef = collection(db, collectionName)
          const snapshot = await getDocs(collectionRef)

          const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          const numericIdDocs = docs.filter((doc) => {
            // Check if document has numeric ID or references numeric player IDs
            return (
              /^\d+$/.test(doc.id) || // Document ID is numeric
              /^\d+$/.test(doc.playerId) || // playerId field is numeric
              /^\d+$/.test(doc.playerNumber) || // playerNumber field is numeric
              (doc.players &&
                Array.isArray(doc.players) &&
                doc.players.some((p: any) => /^\d+$/.test(p.id || p.playerId))) // Array of players with numeric IDs
            )
          })

          results.push({
            name: collectionName,
            totalDocs: docs.length,
            numericIdDocs: numericIdDocs.length,
            sampleDocs: numericIdDocs.slice(0, 3), // First 3 samples
          })

          addDebug(`${collectionName}: ${docs.length} total docs, ${numericIdDocs.length} with numeric IDs`)
        } catch (error) {
          addDebug(`Error scanning ${collectionName}: ${error}`)
        }
      }

      setScanResults(results)
      addDebug("Scan complete!")
    } catch (error) {
      addDebug(`Scan error: ${error}`)
    } finally {
      setScanning(false)
    }
  }

  const fixAllCollections = async () => {
    setFixing(true)
    setFixResults([])

    try {
      addDebug("Starting comprehensive fix of all collections...")

      // Get player registry for lookups
      const registrySnapshot = await getDocs(collection(db, "players"))
      const registryPlayers = registrySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      addDebug(`Loaded ${registryPlayers.length} players from registry`)

      const results: FixResult[] = []

      for (const scanResult of scanResults) {
        if (scanResult.numericIdDocs === 0) continue

        addDebug(`Fixing ${scanResult.name} collection...`)

        const result: FixResult = {
          collection: scanResult.name,
          updated: 0,
          failed: 0,
          errors: [],
        }

        try {
          const collectionRef = collection(db, scanResult.name)
          const snapshot = await getDocs(collectionRef)

          for (const docSnapshot of snapshot.docs) {
            const docData = docSnapshot.data()
            const docId = docSnapshot.id

            let needsUpdate = false
            const updates: any = {}

            // Check if document ID is numeric and needs registryId
            if (/^\d+$/.test(docId)) {
              const matchingPlayer = registryPlayers.find((p) => p.name === docData.name && p.team === docData.team)

              if (matchingPlayer) {
                updates.registryId = matchingPlayer.id
                needsUpdate = true
                addDebug(`Found registry match for ${docData.name}: ${matchingPlayer.id}`)
              }
            }

            // Check if playerId field is numeric
            if (docData.playerId && /^\d+$/.test(docData.playerId)) {
              const matchingPlayer = registryPlayers.find(
                (p) => p.id === docData.playerId || (p.name === docData.playerName && p.team === docData.team),
              )

              if (matchingPlayer) {
                updates.playerId = matchingPlayer.id
                needsUpdate = true
                addDebug(`Updated playerId for ${docData.playerName || docId}`)
              }
            }

            if (needsUpdate) {
              try {
                await updateDoc(doc(db, scanResult.name, docId), updates)
                result.updated++
              } catch (error) {
                result.failed++
                result.errors.push(`${docId}: ${error}`)
              }
            }
          }
        } catch (error) {
          result.errors.push(`Collection error: ${error}`)
        }

        results.push(result)
        addDebug(`${scanResult.name}: Updated ${result.updated}, Failed ${result.failed}`)
      }

      setFixResults(results)
      addDebug("Comprehensive fix complete!")
    } catch (error) {
      addDebug(`Fix error: ${error}`)
    } finally {
      setFixing(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive ID Fix</h1>
          <p className="text-gray-600 mt-2">Scan and fix ALL collections that contain player data with numeric IDs</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={scanAllCollections} disabled={scanning} className="bg-blue-600 hover:bg-blue-700">
            {scanning ? "Scanning..." : "Scan All Collections"}
          </Button>

          {scanResults.length > 0 && (
            <Button onClick={fixAllCollections} disabled={fixing} className="bg-green-600 hover:bg-green-700">
              {fixing ? "Fixing..." : "Fix All Collections"}
            </Button>
          )}
        </div>

        {/* Scan Results */}
        {scanResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
              <CardDescription>Collections with numeric player IDs that need fixing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Collection</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Total Docs</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Numeric ID Docs</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Sample Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.map((result) => (
                      <tr key={result.name}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{result.name}</td>
                        <td className="border border-gray-300 px-4 py-2">{result.totalDocs}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={result.numericIdDocs > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                            {result.numericIdDocs}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {result.sampleDocs.length > 0 ? (
                            <div className="text-xs">
                              {result.sampleDocs.map((doc, idx) => (
                                <div key={idx} className="mb-1">
                                  ID: {doc.id}, Name: {doc.name || doc.playerName || "N/A"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">None</span>
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

        {/* Fix Results */}
        {fixResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fix Results</CardTitle>
              <CardDescription>Results of the comprehensive fix operation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Collection</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Updated</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Failed</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixResults.map((result) => (
                      <tr key={result.collection}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{result.collection}</td>
                        <td className="border border-gray-300 px-4 py-2 text-green-600 font-bold">{result.updated}</td>
                        <td className="border border-gray-300 px-4 py-2 text-red-600 font-bold">{result.failed}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {result.errors.length > 0 ? (
                            <div className="text-xs text-red-600">
                              {result.errors.slice(0, 3).map((error, idx) => (
                                <div key={idx}>{error}</div>
                              ))}
                              {result.errors.length > 3 && <div>...and {result.errors.length - 3} more</div>}
                            </div>
                          ) : (
                            <span className="text-green-600">None</span>
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

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {info}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
