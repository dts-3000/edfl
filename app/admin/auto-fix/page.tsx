"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AutoFixPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runAutoFix = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/fix-player-ids")
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || "Unknown error occurred")
      }
    } catch (err) {
      setError(err.message || "Failed to run auto fix")
    } finally {
      setLoading(false)
    }
  }

  // Auto-run the fix when the page loads
  useEffect(() => {
    runAutoFix()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Auto Fix Player IDs</h1>
          <p className="text-gray-600 mt-2">Automatically fixing all players with numeric IDs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fix Status</CardTitle>
            <CardDescription>{loading ? "Running automatic fix..." : "Results of the automatic fix"}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            ) : results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold">{results.total}</div>
                    <div className="text-sm text-gray-600">Total Players</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{results.updated}</div>
                    <div className="text-sm text-gray-600">Updated</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Registry ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((result, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{result.id}</td>
                          <td className="border border-gray-300 px-4 py-2">{result.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{result.team}</td>
                          <td className="border border-gray-300 px-4 py-2">{result.registryId || "-"}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span
                              className={
                                result.status === "updated"
                                  ? "text-green-600"
                                  : result.status === "updated-fuzzy"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {result.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <Button onClick={runAutoFix} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    Run Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No results yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
