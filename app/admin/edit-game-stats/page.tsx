"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Save, RefreshCw, AlertCircle } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface PlayerStat {
  id: string
  season: string
  round: string
  team: string
  playerName: string
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
  originalFantasyPoints?: number
}

export default function EditGameStatsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [filteredStats, setFilteredStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRound, setSelectedRound] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all")
  const [editedStats, setEditedStats] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const [availableRounds, setAvailableRounds] = useState<string[]>([])
  const [availableTeams, setAvailableTeams] = useState<string[]>([])

  useEffect(() => {
    loadPlayerStats()
  }, [])

  useEffect(() => {
    filterStats()
  }, [playerStats, searchTerm, selectedRound, selectedTeam, selectedQuarter])

  const loadPlayerStats = async () => {
    try {
      setError(null)
      setLoading(true)

      const statsRef = collection(db, "playerStats")
      // Use simple query without orderBy to avoid index requirements
      const snapshot = await getDocs(statsRef)

      const stats = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          season: data.season || "2025",
          round: data.round || "",
          team: data.team || "",
          playerName: data.playerName || "",
          quarter: data.quarter || "",
          kicks: data.kicks || 0,
          handballs: data.handballs || 0,
          marks: data.marks || 0,
          tackles: data.tackles || 0,
          hitOuts: data.hitOuts || 0,
          goals: data.goals || 0,
          behinds: data.behinds || 0,
          fantasyPoints: data.fantasyPoints || 0,
          matchId: data.matchId || "",
          originalFantasyPoints: data.fantasyPoints || 0,
        }
      })

      // Sort in JavaScript instead of Firestore
      stats.sort((a, b) => {
        if (a.round !== b.round) {
          return Number.parseInt(a.round) - Number.parseInt(b.round)
        }
        return a.playerName.localeCompare(b.playerName)
      })

      setPlayerStats(stats)

      // Extract unique rounds and teams for filters
      const rounds = [...new Set(stats.map((s) => s.round))].sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
      const teams = [...new Set(stats.map((s) => s.team))].sort()
      setAvailableRounds(rounds)
      setAvailableTeams(teams)

      setLoading(false)
    } catch (error: any) {
      console.error("Error loading player stats:", error)
      setError(`Error loading stats: ${error.message}`)
      setLoading(false)
    }
  }

  const filterStats = () => {
    let filtered = playerStats

    if (searchTerm) {
      filtered = filtered.filter(
        (stat) =>
          stat.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stat.team.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedRound !== "all") {
      filtered = filtered.filter((stat) => stat.round === selectedRound)
    }

    if (selectedTeam !== "all") {
      filtered = filtered.filter((stat) => stat.team === selectedTeam)
    }

    if (selectedQuarter !== "all") {
      filtered = filtered.filter((stat) => stat.quarter === selectedQuarter)
    }

    setFilteredStats(filtered)
  }

  const updateStat = (statId: string, field: keyof PlayerStat, value: string | number) => {
    setPlayerStats((prev) =>
      prev.map((stat) => {
        if (stat.id === statId) {
          const updatedStat = { ...stat, [field]: typeof value === "string" ? Number.parseInt(value) || 0 : value }

          // Auto-calculate fantasy points if other stats change
          if (field !== "fantasyPoints") {
            const newFantasyPoints = calculateFantasyPoints(updatedStat)
            updatedStat.fantasyPoints = newFantasyPoints
          }

          return updatedStat
        }
        return stat
      }),
    )
    setEditedStats((prev) => new Set(prev).add(statId))
  }

  const calculateFantasyPoints = (stat: PlayerStat): number => {
    // Standard fantasy points calculation
    return (
      stat.kicks * 3 +
      stat.handballs * 2 +
      stat.marks * 3 +
      stat.tackles * 4 +
      stat.hitOuts * 1 +
      stat.goals * 6 +
      stat.behinds * 1
    )
  }

  const saveStat = async (stat: PlayerStat) => {
    setSaving(stat.id)
    try {
      const statRef = doc(db, "playerStats", stat.id)
      await updateDoc(statRef, {
        kicks: stat.kicks,
        handballs: stat.handballs,
        marks: stat.marks,
        tackles: stat.tackles,
        hitOuts: stat.hitOuts,
        goals: stat.goals,
        behinds: stat.behinds,
        fantasyPoints: stat.fantasyPoints,
        updatedAt: new Date(),
      })

      setEditedStats((prev) => {
        const newSet = new Set(prev)
        newSet.delete(stat.id)
        return newSet
      })
    } catch (error: any) {
      console.error("Error saving stat:", error)
      setError(`Error saving stat: ${error.message}`)
    } finally {
      setSaving(null)
    }
  }

  const saveAllEdited = async () => {
    const editedStatsList = playerStats.filter((s) => editedStats.has(s.id))
    for (const stat of editedStatsList) {
      await saveStat(stat)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-lg">Loading player stats...</div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadPlayerStats} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Edit Game Stats</h1>
          <Button onClick={saveAllEdited} disabled={editedStats.size === 0} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Save All ({editedStats.size})
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search player or team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rounds</SelectItem>
                  {availableRounds.map((round) => (
                    <SelectItem key={round} value={round}>
                      Round {round}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {availableTeams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Quarters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  <SelectItem value="1">Quarter 1</SelectItem>
                  <SelectItem value="2">Quarter 2</SelectItem>
                  <SelectItem value="3">Quarter 3</SelectItem>
                  <SelectItem value="4">Quarter 4</SelectItem>
                  <SelectItem value="All">Full Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Player Game Stats ({filteredStats.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No stats found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-left p-2">Team</th>
                      <th className="text-left p-2">Round</th>
                      <th className="text-left p-2">Quarter</th>
                      <th className="text-left p-2">Kicks</th>
                      <th className="text-left p-2">Handballs</th>
                      <th className="text-left p-2">Marks</th>
                      <th className="text-left p-2">Tackles</th>
                      <th className="text-left p-2">Hit Outs</th>
                      <th className="text-left p-2">Goals</th>
                      <th className="text-left p-2">Behinds</th>
                      <th className="text-left p-2">Fantasy Pts</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStats.map((stat) => (
                      <tr key={stat.id} className={`border-b ${editedStats.has(stat.id) ? "bg-yellow-50" : ""}`}>
                        <td className="p-2 font-medium">{stat.playerName}</td>
                        <td className="p-2">{stat.team}</td>
                        <td className="p-2">{stat.round}</td>
                        <td className="p-2">{stat.quarter}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.kicks}
                            onChange={(e) => updateStat(stat.id, "kicks", e.target.value)}
                            className="w-16"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.handballs}
                            onChange={(e) => updateStat(stat.id, "handballs", e.target.value)}
                            className="w-16"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.marks}
                            onChange={(e) => updateStat(stat.id, "marks", e.target.value)}
                            className="w-16"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.tackles}
                            onChange={(e) => updateStat(stat.id, "tackles", e.target.value)}
                            className="w-16"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.hitOuts}
                            onChange={(e) => updateStat(stat.id, "hitOuts", e.target.value)}
                            className="w-16"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.goals}
                            onChange={(e) => updateStat(stat.id, "goals", e.target.value)}
                            className="w-16"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.behinds}
                            onChange={(e) => updateStat(stat.id, "behinds", e.target.value)}
                            className="w-16"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={stat.fantasyPoints}
                            onChange={(e) => updateStat(stat.id, "fantasyPoints", e.target.value)}
                            className="w-20"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            onClick={() => saveStat(stat)}
                            disabled={saving === stat.id || !editedStats.has(stat.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {saving === stat.id ? "Saving..." : "Save"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {editedStats.size > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-yellow-800">{editedStats.size} stat(s) have unsaved changes</span>
                <Button onClick={saveAllEdited} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
