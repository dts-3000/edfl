"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, FileText, Filter, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ClubRecordsForm from "./ClubRecordsForm"
import { deleteClub } from "@/lib/firebase/actions"
import { toast } from "sonner"
import Link from "next/link"

interface Club {
  id: string
  name: string
  slug: string
  location: string
  description: string
  founded: string
  colors: string
  homeGround: string
  current: boolean
  status: string
  createdAt: Date
  updatedAt: Date
}

interface ClubManagementTableProps {
  data: Club[]
  onEdit: (club: Club) => void
}

export default function ClubManagementTable({ data, onEdit }: ClubManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [isRecordsDialogOpen, setIsRecordsDialogOpen] = useState(false)

  // Filter clubs based on search term and status
  const filteredClubs = data.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "current" && club.current) ||
      (statusFilter === "historical" && !club.current)
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (club: Club) => {
    if (confirm(`Are you sure you want to delete ${club.name}? This action cannot be undone.`)) {
      try {
        await deleteClub(club.id)
        toast.success(`${club.name} deleted successfully`)
        // Refresh the page or update the data
        window.location.reload()
      } catch (error: any) {
        toast.error(`Failed to delete club: ${error.message}`)
      }
    }
  }

  const handleRecords = (club: Club) => {
    setSelectedClub(club)
    setIsRecordsDialogOpen(true)
  }

  const handleRecordsSave = () => {
    setIsRecordsDialogOpen(false)
    setSelectedClub(null)
    toast.success("Club records saved successfully")
  }

  const handleRecordsCancel = () => {
    setIsRecordsDialogOpen(false)
    setSelectedClub(null)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Club Management ({filteredClubs.length} of {data.length} clubs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clubs by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  <SelectItem value="current">Current Clubs</SelectItem>
                  <SelectItem value="historical">Historical Clubs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.filter((club) => club.current).length}</div>
            <div className="text-sm text-gray-600">Current Clubs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{data.filter((club) => !club.current).length}</div>
            <div className="text-sm text-gray-600">Historical Clubs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{data.length}</div>
            <div className="text-sm text-gray-600">Total Clubs</div>
          </CardContent>
        </Card>
      </div>

      {/* Clubs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Founded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClubs.map((club) => (
                <TableRow key={club.id}>
                  <TableCell className="font-medium">{club.name}</TableCell>
                  <TableCell>{club.location}</TableCell>
                  <TableCell>{club.founded || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={club.current ? "default" : "secondary"}>
                      {club.current ? "Current" : "Historical"}
                    </Badge>
                  </TableCell>
                  <TableCell>{club.colors || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(club)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRecords(club)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Link href={`/clubs/${club.slug}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(club)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Records Dialog */}
      <Dialog open={isRecordsDialogOpen} onOpenChange={setIsRecordsDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClub ? `${selectedClub.name} - Records & History` : "Club Records"}</DialogTitle>
          </DialogHeader>
          {selectedClub && (
            <ClubRecordsForm club={selectedClub} onSave={handleRecordsSave} onCancel={handleRecordsCancel} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
