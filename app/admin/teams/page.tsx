"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Team {
  id: string
  name: string
  homeGround: string
  primaryColor: string
  secondaryColor: string
  createdAt: any
  updatedAt: any
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    homeGround: "",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const teamsCollection = collection(db, "teams")
      const teamsSnapshot = await getDocs(teamsCollection)
      const teamsList = teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[]

      // Sort teams by name
      teamsList.sort((a, b) => a.name.localeCompare(b.name))

      setTeams(teamsList)
    } catch (error) {
      console.error("Error fetching teams:", error)
      toast({
        title: "Error",
        description: "Failed to load teams. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddTeam = async () => {
    setIsSubmitting(true)
    try {
      const timestamp = new Date()
      const teamsCollection = collection(db, "teams")
      await addDoc(teamsCollection, {
        ...formData,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      setIsAddDialogOpen(false)
      setFormData({
        name: "",
        homeGround: "",
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
      })

      toast({
        title: "Success",
        description: "Team added successfully!",
      })

      fetchTeams()
    } catch (error) {
      console.error("Error adding team:", error)
      toast({
        title: "Error",
        description: "Failed to add team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTeam = async () => {
    if (!currentTeam) return

    setIsSubmitting(true)
    try {
      const teamRef = doc(db, "teams", currentTeam.id)
      await updateDoc(teamRef, {
        ...formData,
        updatedAt: new Date(),
      })

      setIsEditDialogOpen(false)
      setCurrentTeam(null)

      toast({
        title: "Success",
        description: "Team updated successfully!",
      })

      fetchTeams()
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!currentTeam) return

    setIsSubmitting(true)
    try {
      const teamRef = doc(db, "teams", currentTeam.id)
      await deleteDoc(teamRef)

      setIsDeleteDialogOpen(false)
      setCurrentTeam(null)

      toast({
        title: "Success",
        description: "Team deleted successfully!",
      })

      fetchTeams()
    } catch (error) {
      console.error("Error deleting team:", error)
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (team: Team) => {
    setCurrentTeam(team)
    setFormData({
      name: team.name,
      homeGround: team.homeGround || "",
      primaryColor: team.primaryColor || "#000000",
      secondaryColor: team.secondaryColor || "#ffffff",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (team: Team) => {
    setCurrentTeam(team)
    setIsDeleteDialogOpen(true)
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return

    setIsImporting(true)
    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        const text = e.target?.result as string
        const rows = text.split("\n")
        const headers = rows[0].split(",")

        const nameIndex = headers.findIndex((h) => h.trim().toLowerCase() === "name")
        const homeGroundIndex = headers.findIndex((h) => h.trim().toLowerCase() === "homeground")
        const primaryColorIndex = headers.findIndex((h) => h.trim().toLowerCase() === "primarycolor")
        const secondaryColorIndex = headers.findIndex((h) => h.trim().toLowerCase() === "secondarycolor")

        if (nameIndex === -1) {
          toast({
            title: "Error",
            description: "CSV must contain a 'name' column",
            variant: "destructive",
          })
          setIsImporting(false)
          return
        }

        const timestamp = new Date()
        const teamsCollection = collection(db, "teams")
        let addedCount = 0

        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue

          const columns = rows[i].split(",")

          const name = columns[nameIndex].trim()
          if (!name) continue

          const homeGround = homeGroundIndex !== -1 ? columns[homeGroundIndex]?.trim() || "" : ""
          const primaryColor = primaryColorIndex !== -1 ? columns[primaryColorIndex]?.trim() || "#000000" : "#000000"
          const secondaryColor =
            secondaryColorIndex !== -1 ? columns[secondaryColorIndex]?.trim() || "#ffffff" : "#ffffff"

          await addDoc(teamsCollection, {
            name,
            homeGround,
            primaryColor,
            secondaryColor,
            createdAt: timestamp,
            updatedAt: timestamp,
          })

          addedCount++
        }

        toast({
          title: "Success",
          description: `Imported ${addedCount} teams successfully!`,
        })

        fetchTeams()
        setCsvFile(null)
      }

      reader.readAsText(csvFile)
    } catch (error) {
      console.error("Error importing teams:", error)
      toast({
        title: "Error",
        description: "Failed to import teams. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teams Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Team
          </Button>
          <Button variant="outline" onClick={fetchTeams}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Import Teams from CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">CSV Format: name,homeGround,primaryColor,secondaryColor</p>
              <p className="text-sm text-gray-500 mb-4">
                Example: Deer Park,Deer Park Recreation Reserve,#FF0000,#FFFFFF
              </p>
            </div>
            <div className="flex gap-2">
              <Input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
              <Button onClick={handleCsvUpload} disabled={!csvFile || isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import CSV"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No teams found. Add a team to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Home Ground</TableHead>
                  <TableHead>Primary Color</TableHead>
                  <TableHead>Secondary Color</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.homeGround || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: team.primaryColor || "#000000" }}
                        />
                        {team.primaryColor || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: team.secondaryColor || "#ffffff" }}
                        />
                        {team.secondaryColor || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(team)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(team)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Team Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="homeGround" className="text-right">
                Home Ground
              </Label>
              <Input
                id="homeGround"
                name="homeGround"
                value={formData.homeGround}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primaryColor" className="text-right">
                Primary Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="color"
                  id="primaryColor"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  className="w-12"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  name="primaryColor"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secondaryColor" className="text-right">
                Secondary Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="color"
                  id="secondaryColor"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  className="w-12"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  name="secondaryColor"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeam} disabled={!formData.name || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-homeGround" className="text-right">
                Home Ground
              </Label>
              <Input
                id="edit-homeGround"
                name="homeGround"
                value={formData.homeGround}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-primaryColor" className="text-right">
                Primary Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="color"
                  id="edit-primaryColor"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  className="w-12"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  name="primaryColor"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-secondaryColor" className="text-right">
                Secondary Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="color"
                  id="edit-secondaryColor"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  className="w-12"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  name="secondaryColor"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeam} disabled={!formData.name || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete <strong>{currentTeam?.name}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
