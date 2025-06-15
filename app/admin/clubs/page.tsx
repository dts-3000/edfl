"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ClubManagementTable from "@/components/admin/ClubManagementTable"
import { getClubs } from "@/lib/firebase/club"
import type { Club } from "@/types"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, TestTube } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addClub, updateClub } from "@/lib/firebase/club"
import { toast } from "sonner"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("Unknown")
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    location: "",
    description: "",
    founded: "",
    colors: "",
    homeGround: "",
  })

  useEffect(() => {
    loadClubs()
  }, [])

  useEffect(() => {
    if (formData.name) {
      const autoSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      setFormData((prev) => ({ ...prev, slug: autoSlug }))
    }
  }, [formData.name])

  const loadClubs = async () => {
    try {
      console.log("🔄 Loading clubs from Firebase...")
      console.log("Firebase config check:", {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅" : "❌",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅" : "❌",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅" : "❌",
      })

      const clubsData = await getClubs()
      console.log("📊 Clubs loaded:", clubsData.length, "clubs")
      console.log("📋 Club data:", clubsData)

      setClubs(clubsData)
      setConnectionStatus("✅ Connected")

      if (clubsData.length === 0) {
        toast.info("No clubs found in database. Try creating some clubs first.")
      } else {
        toast.success(`Loaded ${clubsData.length} clubs`)
      }
    } catch (error: any) {
      console.error("❌ Error loading clubs:", error)
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      })
      setConnectionStatus("❌ Connection Failed")
      toast.error(`Failed to load clubs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (club: Club) => {
    setEditingClub(club)
    setFormData({
      name: club.name,
      slug: club.slug,
      location: club.location || "",
      description: club.description || "",
      founded: club.founded || "",
      colors: club.colors || "",
      homeGround: club.homeGround || "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Auto-generate slug from name when name changes
      const generateSlug = (name: string) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim()
      }

      const updatedFormData = {
        ...formData,
        // Always regenerate slug from current name to keep them in sync
        slug: generateSlug(formData.name),
      }

      if (editingClub) {
        await updateClub(editingClub.id, updatedFormData)
        toast.success("Club updated successfully - slug updated to match name")
      } else {
        await addClub(updatedFormData)
        toast.success("Club added successfully")
      }
      setDialogOpen(false)
      setEditingClub(null)
      setFormData({
        name: "",
        slug: "",
        location: "",
        description: "",
        founded: "",
        colors: "",
        homeGround: "",
      })
      loadClubs()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading clubs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Club Management</h1>
        <div className="flex gap-2">
          <Link href="/admin/firebase-test">
            <Button variant="outline" size="sm">
              <TestTube className="w-4 h-4 mr-2" />
              Test Firebase
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadClubs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingClub(null)
                  setFormData({
                    name: "",
                    slug: "",
                    location: "",
                    description: "",
                    founded: "",
                    colors: "",
                    homeGround: "",
                  })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClub ? "Edit Club" : "Add New Club"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (auto-generated)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    readOnly
                    className="bg-gray-100"
                    placeholder="Auto-generated from name"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="founded">Founded</Label>
                  <Input
                    id="founded"
                    value={formData.founded}
                    onChange={(e) => setFormData({ ...formData, founded: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="colors">Colors</Label>
                  <Input
                    id="colors"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="homeGround">Home Ground</Label>
                  <Input
                    id="homeGround"
                    value={formData.homeGround}
                    onChange={(e) => setFormData({ ...formData, homeGround: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingClub ? "Update" : "Add"} Club</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Firebase Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={connectionStatus.includes("✅") ? "default" : "destructive"}>{connectionStatus}</Badge>
            <div className="text-sm text-gray-600">{clubs.length} clubs loaded</div>
          </div>
        </CardContent>
      </Card>

      {clubs.length === 0 && !loading && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">No clubs found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-yellow-700">
              <p>This could mean:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>No clubs have been added to Firebase yet</li>
                <li>Firebase connection issue</li>
                <li>Permission/authentication issue</li>
                <li>Environment variables not configured</li>
              </ul>
              <div className="mt-4 space-y-2">
                <p className="font-semibold">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Test Firebase" to check connection</li>
                  <li>Check browser console for error messages</li>
                  <li>Verify environment variables are set</li>
                  <li>Try adding a club manually</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ClubManagementTable data={clubs} onEdit={handleEdit} />
    </div>
  )
}
