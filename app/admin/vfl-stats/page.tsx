"use client"

import React from "react"

import type { ReactElement } from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, FileUp, Check, AlertCircle } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage"
import { setLatestVFLDataUrl } from "@/lib/vflData"

interface PreviewData {
  headers: string[]
  rows: string[][]
}

export default function VFLStatsUploadPage(): ReactElement {
  const [file, setFile] = useState<File | null>(null)
  const [season, setSeason] = useState(new Date().getFullYear().toString())
  const [uploading, setUploading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [recentUploads, setRecentUploads] = useState<{ name: string; url: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch recent uploads on component mount
  React.useEffect(() => {
    async function fetchRecentUploads() {
      try {
        const storageRef = ref(storage, "vfl-stats")
        const result = await listAll(storageRef)

        // Get the most recent 5 files
        const files = await Promise.all(
          result.items
            .sort((a, b) => {
              // Sort by name in descending order (most recent first)
              return b.name.localeCompare(a.name)
            })
            .slice(0, 5)
            .map(async (item) => {
              const url = await getDownloadURL(item)
              return { name: item.name, url }
            }),
        )

        setRecentUploads(files)

        // Check localStorage first, then use most recent file
        const savedUrl = localStorage.getItem("vflDataUrl")
        if (savedUrl) {
          setLatestVFLDataUrl(savedUrl)
          console.log("Using saved VFL data source:", savedUrl)
        } else if (files.length > 0) {
          setLatestVFLDataUrl(files[0].url)
          console.log("Using most recent VFL data source:", files[0].url)
        }
      } catch (error) {
        console.error("Error fetching recent uploads:", error)
      }
    }

    fetchRecentUploads()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadSuccess(false)
      setUploadedFileUrl(null)

      // Parse CSV for preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const lines = text.split("\n")

        if (lines.length > 0) {
          const headers = lines[0].split(",")
          const rows = lines.slice(1, 6).map((line) => line.split(",")) // Preview first 5 rows

          setPreviewData({ headers, rows })
        }
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file || !season) {
      toast({
        title: "Missing Information",
        description: "Please select a file and season before uploading.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      console.log("Starting upload process...")

      // Validate file type
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Please select a CSV file")
      }

      // Create a unique filename with timestamp
      const timestamp = new Date().getTime()
      const filename = `VFL_Upload_${season}_${timestamp}.csv`
      console.log("Uploading file:", filename)

      // Upload to Firebase Storage
      const storageRef = ref(storage, `vfl-stats/${filename}`)
      console.log("Uploading to Firebase Storage...")

      const uploadResult = await uploadBytes(storageRef, file)
      console.log("Upload successful:", uploadResult)

      // Get the download URL
      console.log("Getting download URL...")
      const downloadURL = await getDownloadURL(storageRef)
      console.log("Download URL:", downloadURL)

      // Set this as the latest VFL data source
      setLatestVFLDataUrl(downloadURL)

      setUploadedFileUrl(downloadURL)
      setUploadSuccess(true)
      setFile(null)
      setPreviewData(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Add to recent uploads
      setRecentUploads((prev) => [{ name: filename, url: downloadURL }, ...prev.slice(0, 4)])

      toast({
        title: "Upload Successful",
        description: "VFL statistics have been uploaded and set as the current data source.",
      })

      // Refresh the VFL stats page after a short delay
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error: any) {
      console.error("Detailed error:", error)

      let errorMessage = "Unknown error occurred"

      if (error.code === "storage/unauthorized") {
        errorMessage = "Unauthorized access to Firebase Storage. Please check permissions."
      } else if (error.code === "storage/canceled") {
        errorMessage = "Upload was canceled."
      } else if (error.code === "storage/unknown") {
        errorMessage = "Unknown storage error. Please try again."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Upload Failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUseFile = async (url: string, name: string) => {
    try {
      console.log("Setting VFL data source to:", url)
      setLatestVFLDataUrl(url)

      // Store in localStorage for persistence
      localStorage.setItem("vflDataUrl", url)

      toast({
        title: "Data Source Updated",
        description: `Now using ${name} as the VFL data source.`,
      })

      // Force a page refresh to reload data
      window.location.reload()
    } catch (error) {
      console.error("Error setting data source:", error)
      toast({
        title: "Error",
        description: "Failed to update data source.",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload VFL Player Statistics</h1>
          <p className="text-muted-foreground">Upload CSV files containing VFL player statistics for processing</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload VFL Statistics File</CardTitle>
              <CardDescription>
                Upload a CSV file with VFL player statistics including goals, behinds, kicks, handballs, marks, tackles,
                and hit outs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="season">Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">VFL Statistics File (CSV)</Label>
                <div className="flex items-center gap-2">
                  <Input ref={fileInputRef} id="file" type="file" accept=".csv" onChange={handleFileChange} />
                </div>
              </div>

              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 flex flex-col gap-2">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-green-700 text-sm">VFL statistics file uploaded successfully!</p>
                  </div>
                  {uploadedFileUrl && (
                    <div className="text-xs text-gray-600 break-all">
                      <p className="font-medium">File URL (for reference):</p>
                      <p className="mt-1">{uploadedFileUrl}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpload} disabled={!file || !season || uploading} className="w-full">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload VFL Statistics
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Preview</CardTitle>
              <CardDescription>Preview of the selected CSV file</CardDescription>
            </CardHeader>
            <CardContent>
              {file ? (
                previewData ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr>
                          {previewData.headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-2 py-2 whitespace-nowrap text-xs">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <FileUp className="h-12 w-12 mb-2 text-gray-400" />
                  <p>No file selected</p>
                  <p className="text-xs mt-1">Select a CSV file to see a preview</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="text-sm text-gray-500">
                <p className="font-medium">Expected CSV Format:</p>
                <p className="mt-1">Date, VFL Round, Player, EDFL Club, VFL Club, G, B, K, H, M, T, HO, TotalFP</p>
              </div>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Recently uploaded VFL statistics files</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUploads.length > 0 ? (
              <div className="space-y-3">
                {recentUploads.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <FileUp className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{file.url}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUseFile(file.url, file.name)}>
                      Use This File
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No recent uploads found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-blue-800 font-medium mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                CSV File Requirements
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-blue-700">
                <li>File must be in CSV format with comma-separated values</li>
                <li>First row should contain column headers</li>
                <li>Required columns: Date, VFL Round, Player, EDFL Club, VFL Club, G, B, K, H, M, T, HO, TotalFP</li>
                <li>All statistic values should be numeric</li>
                <li>Date should be in DD/MM/YYYY format</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Processing Information</h3>
              <p className="text-sm text-gray-600">
                After uploading, the VFL statistics will be automatically set as the current data source. The VFL Stats
                page will use this data immediately after upload.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
