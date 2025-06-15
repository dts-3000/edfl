"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search, UserPlus, Edit, Trash2, RefreshCw } from "lucide-react"
import { fetchPlayerData } from "@/lib/playerData"
import type { Player } from "@/lib/teamData"
import { getTeamLogoPath } from "@/lib/teamLogos"

interface EditablePlayer extends Player {
  isEditing?: boolean
}

// Define player status options
const PLAYER_STATUS_OPTIONS = [
  "Active",
  "Injured",
  "Suspended",
  "Not Selected",
  "Selected In 22",
  "VFL Listed",
  "Doubtful",
  "Unavailable",
  "Retired",
]

export default function PlayersPage() {
  const [players, setPlayers] = useState<EditablePlayer[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<EditablePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<EditablePlayer | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedPlayer, setEditedPlayer] = useState<Partial<Player>>({})
  const [processingAction, setProcessingAction] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPlayer, setNewPlayer] = useState<Omit<Player, "id">>({
    name: "",
    team: "",
    position: "",
    price: 0,
    score1: null,
    score2: null,
    score3: null,
    roundScores: [null, null, null],
    averageScore: 0,
    vflAvg: null,
    lastRoundScore: null,
    rollingAvg3: null,
    adjAvg: null,
    expectedPrice: null,
    priceChange: null,
    breakeven: null,
    gamesPlayed: null,
    status: "Active",
    roundUpdated: null,
  })

  const loadPlayers = async () => {
    try {
      setLoading(true)
      const playerData = await fetchPlayerData()
      setPlayers(playerData)
      setFilteredPlayers(playerData)
    } catch (error) {
      console.error("Error loading player data:", error)
      toast({
        title: "Error",
        description: "Failed to load player data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    let filtered = players

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.position.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply team filter
    if (teamFilter) {
      filtered = filtered.filter((player) => player.team === teamFilter)
    }

    setFilteredPlayers(filtered)
  }, [searchTerm, teamFilter, players])

  const handleEditPlayer = async () => {
    if (!selectedPlayer || !editedPlayer) return

    try {
      setProcessingAction(true)

      // Create a reference to the players collection
      const playersCollection = collection(db, "players")

      // Create a document reference with the player ID
      const playerDocRef = doc(playersCollection, selectedPlayer.id)

      // Prepare the data to update
      const updatedData = {
        ...editedPlayer,
        id: selectedPlayer.id, // Ensure ID is included
        updatedAt: new Date().toISOString(),
      }

      // Save to Firestore
      await setDoc(playerDocRef, updatedData, { merge: true })

      // Update local state
      const updatedPlayers = players.map((player) =>
        player.id === selectedPlayer.id ? { ...player, ...editedPlayer } : player,
      )

      setPlayers(updatedPlayers)
      setFilteredPlayers(
        updatedPlayers.filter(
          (player) =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.position.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

      toast({
        title: "Success",
        description: `${selectedPlayer.name} has been updated in the database.`,
      })
    } catch (error) {
      console.error("Error updating player:", error)
      toast({
        title: "Error",
        description: "Failed to update player. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
      setIsEditDialogOpen(false)
      setSelectedPlayer(null)
      setEditedPlayer({})
    }
  }

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return

    try {
      setProcessingAction(true)

      // In a real implementation, this would delete the player from your database
      // For now, we'll just update the local state
      const updatedPlayers = players.filter((player) => player.id !== selectedPlayer.id)

      setPlayers(updatedPlayers)
      setFilteredPlayers(
        updatedPlayers.filter(
          (player) =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.position.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

      toast({
        title: "Success",
        description: `${selectedPlayer.name} has been deleted.`,
      })
    } catch (error) {
      console.error("Error deleting player:", error)
      toast({
        title: "Error",
        description: "Failed to delete player. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
      setIsDeleteDialogOpen(false)
      setSelectedPlayer(null)
    }
  }

  const handleCreatePlayer = async () => {
    if (!newPlayer.name || !newPlayer.team || !newPlayer.position) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Team, Position).",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessingAction(true)

      // Generate a unique ID for the new player
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create a reference to the players collection
      const playersCollection = collection(db, "players")
      const playerDocRef = doc(playersCollection, playerId)

      // Prepare the player data
      const playerData = {
        ...newPlayer,
        id: playerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save to Firestore
      await setDoc(playerDocRef, playerData)

      // Update local state
      const updatedPlayers = [...players, playerData]
      setPlayers(updatedPlayers)
      setFilteredPlayers(
        updatedPlayers.filter(
          (player) =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.position.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

      toast({
        title: "Success",
        description: `${newPlayer.name} has been added successfully.`,
      })

      // Reset form
      setNewPlayer({
        name: "",
        team: "",
        position: "",
        price: 0,
        score1: null,
        score2: null,
        score3: null,
        roundScores: [null, null, null],
        averageScore: 0,
        vflAvg: null,
        lastRoundScore: null,
        rollingAvg3: null,
        adjAvg: null,
        expectedPrice: null,
        priceChange: null,
        breakeven: null,
        gamesPlayed: null,
        status: "Active",
        roundUpdated: null,
      })
    } catch (error) {
      console.error("Error creating player:", error)
      toast({
        title: "Error",
        description: "Failed to create player. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
      setIsCreateDialogOpen(false)
    }
  }

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Player Management</h1>
            <p className="text-muted-foreground">Manage player data and information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPlayers} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search players by name, team, or position..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Teams</SelectItem>
                <SelectItem value="Airport West">Airport West</SelectItem>
                <SelectItem value="Aberfeldie">Aberfeldie</SelectItem>
                <SelectItem value="Deer Park">Deer Park</SelectItem>
                <SelectItem value="Essendon Doutta Stars">Essendon Doutta Stars</SelectItem>
                <SelectItem value="Greenvale">Greenvale</SelectItem>
                <SelectItem value="Keilor">Keilor</SelectItem>
                <SelectItem value="Maribyrnong Park">Maribyrnong Park</SelectItem>
                <SelectItem value="Pascoe Vale">Pascoe Vale</SelectItem>
                <SelectItem value="Strathmore">Strathmore</SelectItem>
                <SelectItem value="East Keilor">East Keilor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading players...</span>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-2">
                              <img
                                src={getTeamLogoPath(player.team) || "/placeholder.svg"}
                                alt={player.team}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                                onError={handleImageError}
                              />
                            </div>
                            {player.team}
                          </div>
                        </TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>${player.price.toLocaleString()}</TableCell>
                        <TableCell>{player.averageScore || 0}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              player.status === "Injured"
                                ? "bg-red-100 text-red-800"
                                : player.status === "Suspended"
                                  ? "bg-orange-100 text-orange-800"
                                  : player.status === "Not Selected"
                                    ? "bg-gray-100 text-gray-800"
                                    : player.status === "Selected In 22"
                                      ? "bg-blue-100 text-blue-800"
                                      : player.status === "VFL Listed"
                                        ? "bg-purple-100 text-purple-800"
                                        : player.status === "Doubtful"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                            }`}
                          >
                            {player.status || "Active"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              setSelectedPlayer(player)
                              setEditedPlayer({
                                name: player.name,
                                team: player.team,
                                position: player.position,
                                price: player.price,
                                status: player.status || "Active",
                              })
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedPlayer(player)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No players found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Player Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPlayer?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlayer} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Player"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player information for {selectedPlayer?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={editedPlayer.name || ""}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="team" className="text-right text-sm font-medium">
                Team
              </label>
              <Input
                id="team"
                value={editedPlayer.team || ""}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, team: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="position" className="text-right text-sm font-medium">
                Position
              </label>
              <Input
                id="position"
                value={editedPlayer.position || ""}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, position: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="price" className="text-right text-sm font-medium">
                Price
              </label>
              <Input
                id="price"
                type="number"
                value={editedPlayer.price || 0}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, price: Number.parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right text-sm font-medium">
                Status
              </label>
              <div className="col-span-3">
                <Select
                  value={editedPlayer.status || "Active"}
                  onValueChange={(value) => setEditedPlayer({ ...editedPlayer, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button onClick={handleEditPlayer} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Player Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>Create a new player in the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="newName" className="text-right text-sm font-medium">
                Name *
              </label>
              <Input
                id="newName"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter player name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="newTeam" className="text-right text-sm font-medium">
                Team *
              </label>
              <div className="col-span-3">
                <Select value={newPlayer.team} onValueChange={(value) => setNewPlayer({ ...newPlayer, team: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airport West">Airport West</SelectItem>
                    <SelectItem value="Aberfeldie">Aberfeldie</SelectItem>
                    <SelectItem value="Deer Park">Deer Park</SelectItem>
                    <SelectItem value="Essendon Doutta Stars">Essendon Doutta Stars</SelectItem>
                    <SelectItem value="Greenvale">Greenvale</SelectItem>
                    <SelectItem value="Keilor">Keilor</SelectItem>
                    <SelectItem value="Maribyrnong Park">Maribyrnong Park</SelectItem>
                    <SelectItem value="Pascoe Vale">Pascoe Vale</SelectItem>
                    <SelectItem value="Strathmore">Strathmore</SelectItem>
                    <SelectItem value="East Keilor">East Keilor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="newPosition" className="text-right text-sm font-medium">
                Position *
              </label>
              <div className="col-span-3">
                <Select
                  value={newPlayer.position}
                  onValueChange={(value) => setNewPlayer({ ...newPlayer, position: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Forward">Forward</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Ruck">Ruck</SelectItem>
                    <SelectItem value="Utility">Utility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="newPrice" className="text-right text-sm font-medium">
                Price
              </label>
              <Input
                id="newPrice"
                type="number"
                value={newPlayer.price}
                onChange={(e) => setNewPlayer({ ...newPlayer, price: Number.parseInt(e.target.value) || 0 })}
                className="col-span-3"
                placeholder="Enter price"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="newStatus" className="text-right text-sm font-medium">
                Status
              </label>
              <div className="col-span-3">
                <Select
                  value={newPlayer.status || "Active"}
                  onValueChange={(value) => setNewPlayer({ ...newPlayer, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlayer}
              disabled={processingAction || !newPlayer.name || !newPlayer.team || !newPlayer.position}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Player"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
