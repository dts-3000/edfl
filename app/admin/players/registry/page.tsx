"use client"

import type React from "react"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search, UserPlus, Edit, Trash2, RefreshCw, Download, AlertTriangle } from "lucide-react"
import {
  type PlayerRegistry,
  getAllPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  importPlayersFromCSV,
} from "@/lib/playerRegistry"

export default function PlayerRegistryPage() {
  const [players, setPlayers] = useState<PlayerRegistry[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerRegistry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRegistry | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editedPlayer, setEditedPlayer] = useState<Partial<PlayerRegistry>>({})
  const [newPlayer, setNewPlayer] = useState<Omit<PlayerRegistry, "id" | "createdAt" | "updatedAt">>({
    playerName: "",
    fullName: "",
    aliases: [],
    currentTeam: "",
    position: "",
    price: 0,
    active: true,
  })
  const [processingAction, setProcessingAction] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<{
    loading: boolean
    total: number
    imported: number
    message: string
  }>({
    loading: false,
    total: 0,
    imported: 0,
    message: "",
  })

  const loadPlayers = async () => {
    try {
      setLoading(true)
      console.log("Loading players from registry...")
      const playerData = await getAllPlayers()
      console.log("Loaded players:", playerData.length)
      setPlayers(playerData)
      setFilteredPlayers(playerData)

      if (playerData.length === 0) {
        toast({
          title: "No Players Found",
          description: "The player registry is empty. Try importing players or adding them manually.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error loading player data:", error)
      toast({
        title: "Error",
        description: `Failed to load player data: ${error.message}`,
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
    if (searchTerm) {
      const filtered = players.filter(
        (player) =>
          player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.currentTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.aliases.some((alias) => alias.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredPlayers(filtered)
    } else {
      setFilteredPlayers(players)
    }
  }, [searchTerm, players])

  const handleCreatePlayer = async () => {
    try {
      setProcessingAction(true)

      // Ensure fullName matches playerName
      if (!newPlayer.fullName && newPlayer.playerName) {
        newPlayer.fullName = newPlayer.playerName
      }

      // Ensure aliases include the player name
      if (!newPlayer.aliases.includes(newPlayer.playerName)) {
        newPlayer.aliases = [...newPlayer.aliases, newPlayer.playerName]
      }

      // Create player
      await createPlayer(newPlayer)

      // Reload players
      await loadPlayers()

      toast({
        title: "Success",
        description: `${newPlayer.playerName} has been added to the registry.`,
      })

      // Reset form
      setNewPlayer({
        playerName: "",
        fullName: "",
        aliases: [],
        currentTeam: "",
        position: "",
        price: 0,
        active: true,
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

  const handleEditPlayer = async () => {
    if (!selectedPlayer || !editedPlayer) return

    try {
      setProcessingAction(true)

      // Ensure fullName matches playerName if playerName is being updated
      if (editedPlayer.playerName && editedPlayer.playerName !== selectedPlayer.playerName) {
        editedPlayer.fullName = editedPlayer.playerName
      }

      // Update player
      await updatePlayer(selectedPlayer.id, editedPlayer)

      // Reload players
      await loadPlayers()

      toast({
        title: "Success",
        description: `${selectedPlayer.playerName} has been updated in the registry.`,
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

      // Delete player
      await deletePlayer(selectedPlayer.id)

      // Update local state
      const updatedPlayers = players.filter((player) => player.id !== selectedPlayer.id)
      setPlayers(updatedPlayers)
      setFilteredPlayers(
        updatedPlayers.filter(
          (player) =>
            player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.currentTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.position.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

      toast({
        title: "Success",
        description: `${selectedPlayer.playerName} has been deleted from the registry.`,
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/csv") {
      setCsvFile(file)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      })
    }
  }

  const handleImportCSV = async () => {
    if (!csvFile) return

    try {
      setImportStatus({
        loading: true,
        total: 0,
        imported: 0,
        message: "Reading CSV file...",
      })

      const text = await csvFile.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim())
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim())
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })
        return row
      })

      setImportStatus({
        loading: true,
        total: rows.length,
        imported: 0,
        message: `Found ${rows.length} players to import...`,
      })

      // Import players
      const importedCount = await importPlayersFromCSV(rows)

      // Reload players
      await loadPlayers()

      setImportStatus({
        loading: false,
        total: rows.length,
        imported: importedCount,
        message: `Successfully imported ${importedCount} new players.`,
      })

      toast({
        title: "Import Complete",
        description: `Imported ${importedCount} new players from CSV.`,
      })

      setCsvFile(null)
    } catch (error) {
      console.error("Error importing CSV:", error)
      setImportStatus({
        loading: false,
        total: 0,
        imported: 0,
        message: "Error importing CSV. Please check the format.",
      })
      toast({
        title: "Error",
        description: "Failed to import CSV. Please check the format.",
        variant: "destructive",
      })
    }
  }

  const handleAliasChange = (index: number, value: string) => {
    const updatedAliases = [...(editedPlayer.aliases || selectedPlayer?.aliases || [])]
    updatedAliases[index] = value
    setEditedPlayer({ ...editedPlayer, aliases: updatedAliases })
  }

  const handleAddAlias = () => {
    const updatedAliases = [...(editedPlayer.aliases || selectedPlayer?.aliases || [])]
    updatedAliases.push("")
    setEditedPlayer({ ...editedPlayer, aliases: updatedAliases })
  }

  const handleRemoveAlias = (index: number) => {
    const updatedAliases = [...(editedPlayer.aliases || selectedPlayer?.aliases || [])]
    updatedAliases.splice(index, 1)
    setEditedPlayer({ ...editedPlayer, aliases: updatedAliases })
  }

  const handleNewPlayerAliasChange = (index: number, value: string) => {
    const updatedAliases = [...newPlayer.aliases]
    updatedAliases[index] = value
    setNewPlayer({ ...newPlayer, aliases: updatedAliases })
  }

  const handleAddNewPlayerAlias = () => {
    const updatedAliases = [...newPlayer.aliases]
    updatedAliases.push("")
    setNewPlayer({ ...newPlayer, aliases: updatedAliases })
  }

  const handleRemoveNewPlayerAlias = (index: number) => {
    const updatedAliases = [...newPlayer.aliases]
    updatedAliases.splice(index, 1)
    setNewPlayer({ ...newPlayer, aliases: updatedAliases })
  }

  // Count players with missing data
  const playersWithMissingPosition = players.filter((p) => !p.position || p.position.trim() === "").length
  const playersWithMissingTeam = players.filter((p) => !p.currentTeam || p.currentTeam.trim() === "").length

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Player Registry</h1>
            <p className="text-muted-foreground">Manage player identities and mapping across systems</p>
            {(playersWithMissingPosition > 0 || playersWithMissingTeam > 0) && (
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  {playersWithMissingPosition > 0 && `${playersWithMissingPosition} players missing position`}
                  {playersWithMissingPosition > 0 && playersWithMissingTeam > 0 && ", "}
                  {playersWithMissingTeam > 0 && `${playersWithMissingTeam} players missing team`}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPlayers} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search players by name, team, or position..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading player registry...</span>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player Name</TableHead>
                    <TableHead>Player ID</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.playerName}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">{player.id}</TableCell>
                        <TableCell>
                          {player.currentTeam || (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Missing
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {player.position || (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Missing
                            </span>
                          )}
                        </TableCell>
                        <TableCell>${player.price?.toLocaleString() || "0"}</TableCell>
                        <TableCell>{player.active ? "Active" : "Inactive"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              setSelectedPlayer(player)
                              setEditedPlayer({})
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

      {/* Create Player Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Add a new player to the registry. This will create a unique player ID that can be used across all systems.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={newPlayer.playerName}
                onChange={(e) => setNewPlayer({ ...newPlayer, playerName: e.target.value })}
                placeholder="e.g., Lin Jong"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={newPlayer.currentTeam}
                  onValueChange={(value) => setNewPlayer({ ...newPlayer, currentTeam: value })}
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={newPlayer.position}
                  onValueChange={(value) => setNewPlayer({ ...newPlayer, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FWD">Forward</SelectItem>
                    <SelectItem value="MID">Midfielder</SelectItem>
                    <SelectItem value="DEF">Defender</SelectItem>
                    <SelectItem value="RUC">Ruck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={newPlayer.price}
                onChange={(e) => setNewPlayer({ ...newPlayer, price: Number(e.target.value) || 0 })}
                placeholder="15000"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Name Aliases</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddNewPlayerAlias}>
                  Add Alias
                </Button>
              </div>
              <div className="space-y-2">
                {newPlayer.aliases.map((alias, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={alias}
                      onChange={(e) => handleNewPlayerAliasChange(index, e.target.value)}
                      placeholder={`Alias ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveNewPlayerAlias(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {newPlayer.aliases.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Add aliases for different name variations (e.g., "L. Jong" for "Lin Jong")
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlayer} disabled={processingAction || !newPlayer.playerName}>
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

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player information for {selectedPlayer?.playerName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={
                  editedPlayer.playerName !== undefined ? editedPlayer.playerName : selectedPlayer?.playerName || ""
                }
                onChange={(e) => setEditedPlayer({ ...editedPlayer, playerName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={
                    editedPlayer.currentTeam !== undefined
                      ? editedPlayer.currentTeam
                      : selectedPlayer?.currentTeam || ""
                  }
                  onValueChange={(value) => setEditedPlayer({ ...editedPlayer, currentTeam: value })}
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={editedPlayer.position !== undefined ? editedPlayer.position : selectedPlayer?.position || ""}
                  onValueChange={(value) => setEditedPlayer({ ...editedPlayer, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FWD">Forward</SelectItem>
                    <SelectItem value="MID">Midfielder</SelectItem>
                    <SelectItem value="DEF">Defender</SelectItem>
                    <SelectItem value="RUC">Ruck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={editedPlayer.price !== undefined ? editedPlayer.price : selectedPlayer?.price || 0}
                onChange={(e) => setEditedPlayer({ ...editedPlayer, price: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Name Aliases</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddAlias}>
                  Add Alias
                </Button>
              </div>
              <div className="space-y-2">
                {(editedPlayer.aliases || selectedPlayer?.aliases || []).map((alias, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={alias}
                      onChange={(e) => handleAliasChange(index, e.target.value)}
                      placeholder={`Alias ${index + 1}`}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveAlias(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <Select
                value={
                  editedPlayer.active !== undefined
                    ? editedPlayer.active
                      ? "active"
                      : "inactive"
                    : selectedPlayer?.active
                      ? "active"
                      : "inactive"
                }
                onValueChange={(value) => setEditedPlayer({ ...editedPlayer, active: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Delete Player Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPlayer?.playerName}? This action cannot be undone.
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

      {/* Import CSV Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Players from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file with columns: playerName, team, position, price</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {importStatus.loading ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p>{importStatus.message}</p>
                {importStatus.total > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${Math.round((importStatus.imported / importStatus.total) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">Select CSV File</Label>
                  <Input id="csvFile" type="file" accept=".csv" onChange={handleFileUpload} />
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Expected CSV format:</strong>
                  </p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    playerName,team,position,price
                    <br />
                    Lin Jong,Deer Park,MID,15000
                    <br />
                    Matthew Hanson,Strathmore,FWD,
                  </code>
                </div>
                {importStatus.message && (
                  <div className="bg-green-50 p-3 rounded-md text-green-800">{importStatus.message}</div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={importStatus.loading}>
              Close
            </Button>
            <Button onClick={handleImportCSV} disabled={importStatus.loading || !csvFile}>
              {importStatus.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import CSV"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
