"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, query, orderBy, getDocs } from "firebase/firestore"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Loader2, FileDown, RefreshCw } from "lucide-react"

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

interface StatsUpload {
  id: string
  fileName: string
  fileURL: string
  round: number
  season: number
  uploadedAt: string
  status: "pending" | "processing" | "completed" | "error"
  processedCount?: number
  totalCount?: number
  errorMessage?: string
}

export default function StatsHistoryPage() {
  const [uploads, setUploads] = useState<StatsUpload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      setLoading(true)
      const uploadsQuery = query(collection(db, "playerStats"), orderBy("uploadedAt", "desc"))
      const querySnapshot = await getDocs(uploadsQuery)

      const uploadsList: StatsUpload[] = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          fileName: data.fileName || "Unknown file",
          fileURL: data.fileURL || "",
          round: data.round || 0,
          season: data.season || 0,
          uploadedAt: data.uploadedAt ? new Date(data.uploadedAt.toDate()).toLocaleString() : "Unknown",
          status: data.status || "pending",
          processedCount: data.processedCount,
          totalCount: data.totalCount,
          errorMessage: data.errorMessage,
        }
      })

      setUploads(uploadsList)
    } catch (error) {
      console.error("Error fetching uploads:", error)
      toast({
        title: "Error",
        description: "Failed to load statistics history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statistics History</h1>
            <p className="text-muted-foreground">View and manage player statistics uploads</p>
          </div>
          <Button onClick={fetchUploads} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading statistics history...</span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.length > 0 ? (
                  uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="font-medium">{upload.fileName}</TableCell>
                      <TableCell>{upload.season}</TableCell>
                      <TableCell>{upload.round}</TableCell>
                      <TableCell>{upload.uploadedAt}</TableCell>
                      <TableCell>{getStatusBadge(upload.status)}</TableCell>
                      <TableCell>
                        {upload.status === "processing" && upload.totalCount ? (
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${((upload.processedCount || 0) / upload.totalCount) * 100}%` }}
                            ></div>
                          </div>
                        ) : upload.status === "completed" ? (
                          <span className="text-sm text-gray-500">{upload.processedCount || 0} records processed</span>
                        ) : upload.status === "error" ? (
                          <span className="text-sm text-red-500">{upload.errorMessage || "Unknown error"}</span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => window.open(upload.fileURL, "_blank")}>
                          <FileDown className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No statistics uploads found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
