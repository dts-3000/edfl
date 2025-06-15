"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getNewsArticles } from "@/lib/newsData"
import { fetchPlayerData } from "@/lib/playerData"
import { fetchMatchData } from "@/lib/matchData"
import { fetchVFLData } from "@/lib/vflData"
import { BarChart, Users, Newspaper, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const [newsCount, setNewsCount] = useState(0)
  const [playerCount, setPlayerCount] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [vflPlayerCount, setVflPlayerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load news articles
        const news = getNewsArticles()
        setNewsCount(news.length)

        // Load player data
        const players = await fetchPlayerData()
        setPlayerCount(players.length)

        // Load match data
        const matches = await fetchMatchData()
        setMatchCount(matches.length)

        // Load VFL data
        const vflData = await fetchVFLData()
        // Count unique players in VFL data
        const uniquePlayers = new Set()
        vflData.forEach((stat) => uniquePlayers.add(stat.Player))
        setVflPlayerCount(uniquePlayers.size)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your EDFL Fantasy system data and management tools.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{playerCount}</div>
                  <p className="text-xs text-muted-foreground">Players in the database</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">News Articles</CardTitle>
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{newsCount}</div>
                  <p className="text-xs text-muted-foreground">Published news articles</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Match Results</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matchCount}</div>
                  <p className="text-xs text-muted-foreground">Recorded match results</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">VFL Players</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vflPlayerCount}</div>
                  <p className="text-xs text-muted-foreground">VFL players tracked</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                <TabsTrigger value="tasks">Pending Tasks</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Dashboard Overview</CardTitle>
                    <CardDescription>
                      Welcome to the EDFL Fantasy admin dashboard. Use the sidebar to navigate to different management
                      sections.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <a href="/admin/news" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                          <h4 className="font-medium">Manage News</h4>
                          <p className="text-sm text-gray-600">Add or edit news articles</p>
                        </a>
                        <a href="/admin/players" className="block p-4 bg-green-50 rounded-lg hover:bg-green-100">
                          <h4 className="font-medium">Update Player Data</h4>
                          <p className="text-sm text-gray-600">Modify player information</p>
                        </a>
                        <a href="/admin/stats/upload" className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100">
                          <h4 className="font-medium">Upload Statistics</h4>
                          <p className="text-sm text-gray-600">Import new player statistics</p>
                        </a>
                        <a href="/admin/vfl-stats" className="block p-4 bg-orange-50 rounded-lg hover:bg-orange-100">
                          <h4 className="font-medium">VFL Stats Upload</h4>
                          <p className="text-sm text-gray-600">Upload VFL player statistics</p>
                        </a>
                        <a href="/admin/clubs" className="block p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                          <h4 className="font-medium">Manage Clubs</h4>
                          <p className="text-sm text-gray-600">Manage club records and articles</p>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="recent">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest actions performed in the admin system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="text-sm font-medium">Player data updated</p>
                        <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4 py-2">
                        <p className="text-sm font-medium">New news article published</p>
                        <p className="text-xs text-gray-500">Yesterday, 3:45 PM</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <p className="text-sm font-medium">Statistics uploaded for Round 10</p>
                        <p className="text-xs text-gray-500">May 15, 2025, 9:15 AM</p>
                      </div>
                      <div className="border-l-4 border-orange-500 pl-4 py-2">
                        <p className="text-sm font-medium">VFL statistics updated</p>
                        <p className="text-xs text-gray-500">May 19, 2025, 2:30 PM</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Tasks</CardTitle>
                    <CardDescription>Tasks that require your attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium">Update player injury status</p>
                          <p className="text-sm text-gray-600">3 players need status updates</p>
                        </div>
                        <a href="/admin/players" className="text-blue-600 text-sm hover:underline">
                          Update
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">Process uploaded statistics</p>
                          <p className="text-sm text-gray-600">Round 10 statistics need processing</p>
                        </div>
                        <a href="/admin/stats/history" className="text-blue-600 text-sm hover:underline">
                          Process
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium">Upload latest VFL statistics</p>
                          <p className="text-sm text-gray-600">VFL Round 9 statistics are available</p>
                        </div>
                        <a href="/admin/vfl-stats" className="text-blue-600 text-sm hover:underline">
                          Upload
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
