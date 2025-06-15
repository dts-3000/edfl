"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getTeamLogoPath } from "@/lib/teamLogos"
import AdminLayout from "@/components/admin/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trophy, Medal, Edit, Trash2, Plus, Upload, Download } from "lucide-react"
import { toast } from "sonner"

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface PremiershipRecord {
  id: string
  year: number
  team: string
  grade: string
  runnerUp?: string
  coach?: string
  captain?: string
  notes?: string
}

interface BestAndFairestRecord {
  id: string
  year: number
  player: string
  team: string
  grade: string
  votes?: number
  notes?: string
}

const teams = [
  "Airport West",
  "Aberfeldie",
  "Deer Park",
  "Essendon Doutta Stars",
  "Greenvale",
  "Keilor",
  "Maribyrnong Park",
  "Pascoe Vale",
  "Strathmore",
  "East Keilor",
  "West Coburg",
  "Northern Saints",
  "Glenroy",
  "Avondale Heights",
]

const grades = ["A Grade", "B Grade", "C Grade", "Reserves", "Under 19s", "Under 17s"]

export default function AdminLeagueHistoryPage() {
  const [premierships, setPremierships] = useState<PremiershipRecord[]>([])
  const [bestAndFairest, setBestAndFairest] = useState<BestAndFairestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"premierships" | "bestfairest">("premierships")

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PremiershipRecord | BestAndFairestRecord | null>(null)
  const [formData, setFormData] = useState<any>({
    year: new Date().getFullYear(),
    team: "",
    grade: "A Grade",
    runnerUp: "",
    coach: "",
    captain: "",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load from Firebase collections
      // For now using sample data - replace with actual Firebase calls
      const samplePremierships = generateSamplePremierships()
      const sampleBestAndFairest = generateSampleBestAndFairest()

      setPremierships(samplePremierships)
      setBestAndFairest(sampleBestAndFairest)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const generateSamplePremierships = (): PremiershipRecord[] => {
    const data: PremiershipRecord[] = []
    for (let year = 2020; year <= 2025; year++) {
      grades.slice(0, 3).forEach((grade) => {
        const team = teams[Math.floor(Math.random() * teams.length)]
        const runnerUp = teams.filter((t) => t !== team)[Math.floor(Math.random() * (teams.length - 1))]

        data.push({
          id: `prem-${year}-${grade}`,
          year,
          team,
          grade,
          runnerUp,
          coach: `Coach ${Math.floor(Math.random() * 100)}`,
          captain: `Captain ${Math.floor(Math.random() * 100)}`,
        })
      })
    }
    return data
  }

  const generateSampleBestAndFairest = (): BestAndFairestRecord[] => {
    const firstNames = ["John", "Michael", "David", "James", "Robert", "William", "Richard", "Thomas", "Mark", "Daniel"]
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ]

    const data: BestAndFairestRecord[] = []
    for (let year = 2020; year <= 2025; year++) {
      grades.slice(0, 3).forEach((grade) => {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const team = teams[Math.floor(Math.random() * teams.length)]

        data.push({
          id: `bnf-${year}-${grade}`,
          year,
          player: `${firstName} ${lastName}`,
          team,
          grade,
          votes: Math.floor(Math.random() * 20) + 15,
        })
      })
    }
    return data
  }

  const getFilteredData = () => {
    const data = activeTab === "premierships" ? premierships : bestAndFairest
    let filtered = [...data]

    if (selectedYear !== "all") {
      filtered = filtered.filter((record) => record.year === Number.parseInt(selectedYear))
    }

    if (selectedTeam !== "all") {
      filtered = filtered.filter((record) => record.team === selectedTeam)
    }

    if (selectedGrade !== "all") {
      filtered = filtered.filter((record) => record.grade === selectedGrade)
    }

    if (searchTerm) {
      filtered = filtered.filter((record) => {
        const searchLower = searchTerm.toLowerCase()
        if (activeTab === "premierships") {
          const p = record as PremiershipRecord
          return (
            p.team.toLowerCase().includes(searchLower) ||
            p.coach?.toLowerCase().includes(searchLower) ||
            p.captain?.toLowerCase().includes(searchLower)
          )
        } else {
          const b = record as BestAndFairestRecord
          return b.player.toLowerCase().includes(searchLower) || b.team.toLowerCase().includes(searchLower)
        }
      })
    }

    return filtered.sort((a, b) => b.year - a.year)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    setFormData({
      year: new Date().getFullYear(),
      team: "",
      grade: "A Grade",
      runnerUp: "",
      coach: "",
      captain: "",
      notes: "",
    })
    setModalOpen(true)
  }

  const handleEdit = (record: PremiershipRecord | BestAndFairestRecord) => {
    setEditingRecord(record)
    setFormData({ ...record })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingRecord) {
        // Update existing record
        if (activeTab === "premierships") {
          const updatedPremierships = premierships.map((p) =>
            p.id === editingRecord.id ? { ...formData, id: editingRecord.id } : p,
          )
          setPremierships(updatedPremierships)
        } else {
          const updatedBestAndFairest = bestAndFairest.map((b) =>
            b.id === editingRecord.id ? { ...formData, id: editingRecord.id } : b,
          )
          setBestAndFairest(updatedBestAndFairest)
        }
        toast.success("Record updated successfully")
      } else {
        // Add new record
        const newRecord = {
          ...formData,
          id: `${activeTab === "premierships" ? "prem" : "bnf"}-${formData.year}-${formData.grade}-${Date.now()}`,
        }

        if (activeTab === "premierships") {
          setPremierships([...premierships, newRecord])
        } else {
          setBestAndFairest([...bestAndFairest, newRecord])
        }
        toast.success("Record added successfully")
      }
      setModalOpen(false)
    } catch (error) {
      console.error("Error saving record:", error)
      toast.error("Failed to save record")
    }
  }

  const handleDelete = async (recordId: string) => {
    try {
      if (activeTab === "premierships") {
        setPremierships(premierships.filter((p) => p.id !== recordId))
      } else {
        setBestAndFairest(bestAndFairest.filter((b) => b.id !== recordId))
      }
      toast.success("Record deleted successfully")
    } catch (error) {
      console.error("Error deleting record:", error)
      toast.error("Failed to delete record")
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  const availableYears = [...new Set([...premierships.map((p) => p.year), ...bestAndFairest.map((b) => b.year)])].sort(
    (a, b) => b - a,
  )
  const availableTeams = [...new Set([...premierships.map((p) => p.team), ...bestAndFairest.map((b) => b.team)])].sort()
  const availableGrades = [
    ...new Set([...premierships.map((p) => p.grade), ...bestAndFairest.map((b) => b.grade)]),
  ].sort()

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading league history...</p>
        </div>
      </AdminLayout>
    )
  }

  const filteredData = getFilteredData()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">League History Management</h1>
            <p className="text-gray-600">Manage premierships and best & fairest records</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === "premierships" ? "Premiership" : "Best & Fairest"}
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("premierships")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "premierships"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Trophy className="h-4 w-4 inline mr-2" />
                Premierships ({premierships.length})
              </button>
              <button
                onClick={() => setActiveTab("bestfairest")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "bestfairest" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Medal className="h-4 w-4 inline mr-2" />
                Best & Fairest ({bestAndFairest.length})
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
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
              </div>

              <div>
                <Label>Grade</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {availableGrades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Search</Label>
                <Input
                  placeholder={activeTab === "premierships" ? "Search teams, coaches..." : "Search players, teams..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {activeTab === "premierships" ? (
                <>
                  <Trophy className="mr-2 h-5 w-5" />
                  Premierships ({filteredData.length})
                </>
              ) : (
                <>
                  <Medal className="mr-2 h-5 w-5" />
                  Best & Fairest Winners ({filteredData.length})
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Year</th>
                    <th className="text-left py-2">Team</th>
                    <th className="text-left py-2">Grade</th>
                    {activeTab === "premierships" ? (
                      <>
                        <th className="text-left py-2">Runner-up</th>
                        <th className="text-left py-2">Coach</th>
                        <th className="text-left py-2">Captain</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left py-2">Player</th>
                        <th className="text-center py-2">Votes</th>
                      </>
                    )}
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{record.year}</td>
                      <td className="py-2">
                        <div className="flex items-center">
                          <img
                            src={getTeamLogoPath(record.team) || "/placeholder.svg"}
                            alt={record.team}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain mr-2"
                            onError={handleImageError}
                          />
                          {record.team}
                        </div>
                      </td>
                      <td className="py-2">{record.grade}</td>
                      {activeTab === "premierships" ? (
                        <>
                          <td className="py-2">{(record as PremiershipRecord).runnerUp || "-"}</td>
                          <td className="py-2">{(record as PremiershipRecord).coach || "-"}</td>
                          <td className="py-2">{(record as PremiershipRecord).captain || "-"}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 font-medium">{(record as BestAndFairestRecord).player}</td>
                          <td className="text-center py-2">{(record as BestAndFairestRecord).votes || "-"}</td>
                        </>
                      )}
                      <td className="text-center py-2">
                        <div className="flex space-x-1 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this{" "}
                                  {activeTab === "premierships" ? "premiership" : "best & fairest"} record? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(record.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Edit" : "Add"} {activeTab === "premierships" ? "Premiership" : "Best & Fairest"}
              </DialogTitle>
              <DialogDescription>
                {editingRecord ? "Update the details for this record." : "Enter the details for the new record."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ""}
                    onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={formData.grade || "A Grade"}
                    onValueChange={(value) => setFormData({ ...formData, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="team">Team</Label>
                <Select
                  value={formData.team || "Airport West"}
                  onValueChange={(value) => setFormData({ ...formData, team: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeTab === "premierships" ? (
                <>
                  <div>
                    <Label htmlFor="runnerUp">Runner-up</Label>
                    <Select
                      value={formData.runnerUp || "Aberfeldie"}
                      onValueChange={(value) => setFormData({ ...formData, runnerUp: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select runner-up team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {teams
                          .filter((t) => t !== formData.team)
                          .map((team) => (
                            <SelectItem key={team} value={team}>
                              {team}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="coach">Coach</Label>
                    <Input
                      id="coach"
                      value={formData.coach || "Coach Name"}
                      onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="captain">Captain</Label>
                    <Input
                      id="captain"
                      value={formData.captain || "Captain Name"}
                      onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="player">Player Name</Label>
                    <Input
                      id="player"
                      value={formData.player || "Player Name"}
                      onChange={(e) => setFormData({ ...formData, player: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="votes">Votes</Label>
                    <Input
                      id="votes"
                      type="number"
                      value={formData.votes || 0}
                      onChange={(e) => setFormData({ ...formData, votes: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingRecord ? "Update" : "Add"} Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
