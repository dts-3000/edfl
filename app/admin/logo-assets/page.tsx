"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Trash2, Eye, Download, Shield, Users, Loader2 } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage"

interface UploadedAsset {
  name: string
  url: string
  type: "shield" | "mascot"
  uploadDate: string
}

export default function LogoAssetsPage() {
  const [shields, setShields] = useState<UploadedAsset[]>([])
  const [mascots, setMascots] = useState<UploadedAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState("")

  // Optimized asset loading with error handling
  const loadAssets = useCallback(async () => {
    try {
      setLoading(true)

      // Load both shields and mascots in parallel
      const [shieldsData, mascotsData] = await Promise.allSettled([loadAssetType("shields"), loadAssetType("mascots")])

      // Handle shields results
      if (shieldsData.status === "fulfilled") {
        setShields(shieldsData.value)
      } else {
        console.error("Error loading shields:", shieldsData.reason)
        setShields([])
      }

      // Handle mascots results
      if (mascotsData.status === "fulfilled") {
        setMascots(mascotsData.value)
      } else {
        console.error("Error loading mascots:", mascotsData.reason)
        setMascots([])
      }
    } catch (error) {
      console.error("Error loading assets:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Helper function to load specific asset type
  const loadAssetType = async (type: "shields" | "mascots"): Promise<UploadedAsset[]> => {
    try {
      const assetsRef = ref(storage, `logo-assets/${type}/`)
      const assetsList = await listAll(assetsRef)

      // Limit concurrent downloads to prevent overwhelming
      const batchSize = 5
      const assets: UploadedAsset[] = []

      for (let i = 0; i < assetsList.items.length; i += batchSize) {
        const batch = assetsList.items.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map(async (item) => {
            try {
              const url = await getDownloadURL(item)
              return {
                name: item.name,
                url,
                type: type.slice(0, -1) as "shield" | "mascot", // Remove 's' from end
                uploadDate: new Date().toLocaleDateString(),
              }
            } catch (error) {
              console.error(`Error loading ${item.name}:`, error)
              return null
            }
          }),
        )

        // Add successful results
        batchResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            assets.push(result.value)
          }
        })
      }

      return assets
    } catch (error) {
      console.error(`Error loading ${type}:`, error)
      return []
    }
  }

  // Load assets on component mount
  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  // Optimized upload function
  const handleUpload = async (file: File, type: "shield" | "mascot") => {
    if (!file) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB.")
      return
    }

    try {
      setUploading(true)
      setUploadProgress(`Preparing ${file.name}...`)

      // Create a clean filename
      const timestamp = Date.now()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const fileName = `${timestamp}-${cleanName}`

      setUploadProgress(`Uploading ${fileName}...`)

      // Create storage reference
      const storageRef = ref(storage, `logo-assets/${type}s/${fileName}`)

      // Upload the file
      await uploadBytes(storageRef, file)

      setUploadProgress(`Getting download URL...`)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Create new asset object
      const newAsset: UploadedAsset = {
        name: fileName,
        url: downloadURL,
        type,
        uploadDate: new Date().toLocaleDateString(),
      }

      // Update state immediately for better UX
      if (type === "shield") {
        setShields((prev) => [newAsset, ...prev]) // Add to beginning for immediate visibility
      } else {
        setMascots((prev) => [newAsset, ...prev])
      }

      setUploadProgress(`${type} uploaded successfully!`)

      // Clear the file input
      const fileInput = document.getElementById(`${type}-upload`) as HTMLInputElement
      if (fileInput) fileInput.value = ""

      // Show success message briefly
      setTimeout(() => setUploadProgress(""), 2000)
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadProgress("")
      alert("Error uploading file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // Optimized delete function
  const handleDelete = async (asset: UploadedAsset) => {
    if (!confirm(`Are you sure you want to delete ${asset.name}?`)) return

    try {
      // Optimistically update UI first
      if (asset.type === "shield") {
        setShields((prev) => prev.filter((s) => s.name !== asset.name))
      } else {
        setMascots((prev) => prev.filter((m) => m.name !== asset.name))
      }

      // Then delete from Firebase
      const storageRef = ref(storage, `logo-assets/${asset.type}s/${asset.name}`)
      await deleteObject(storageRef)
    } catch (error) {
      console.error("Error deleting file:", error)

      // Revert optimistic update on error
      if (asset.type === "shield") {
        setShields((prev) => [...prev, asset])
      } else {
        setMascots((prev) => [...prev, asset])
      }

      alert("Error deleting file. Please try again.")
    }
  }

  // Optimized asset grid with lazy loading
  const AssetGrid = ({ assets, type }: { assets: UploadedAsset[]; type: "shield" | "mascot" }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <Card key={asset.name} className="overflow-hidden">
          <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
            <img
              src={asset.url || "/placeholder.svg"}
              alt={asset.name}
              className="max-w-full max-h-full object-contain"
              loading="lazy" // Lazy load images
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-2 truncate" title={asset.name}>
              {asset.name}
            </h3>
            <p className="text-xs text-gray-500 mb-3">Uploaded: {asset.uploadDate}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.open(asset.url, "_blank")} className="flex-1">
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const a = document.createElement("a")
                  a.href = asset.url
                  a.download = asset.name
                  a.click()
                }}
                title="Download"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(asset)} title="Delete">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const UploadSection = ({ type }: { type: "shield" | "mascot" }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === "shield" ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          Upload New {type === "shield" ? "Shield" : "Mascot"}
        </CardTitle>
        <CardDescription>Upload high-quality {type} images for use in the Logo Builder. Max size: 5MB.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${type}-upload`}>Select {type} image</Label>
            <Input
              id={`${type}-upload`}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file, type)
              }}
              disabled={uploading}
            />
          </div>

          {uploading && uploadProgress && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress}
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>
              <strong>Requirements:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Image format: PNG, JPG, or WebP</li>
              <li>Maximum file size: 5MB</li>
              <li>Recommended: PNG with transparent background</li>
              <li>Minimum size: 200x200 pixels</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading logo assets...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logo Assets Manager</h1>
          <p className="text-muted-foreground">Upload and manage shield templates and mascots for the Logo Builder.</p>
        </div>

        <Tabs defaultValue="shields" className="space-y-6">
          <TabsList>
            <TabsTrigger value="shields" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Shields ({shields.length})
            </TabsTrigger>
            <TabsTrigger value="mascots" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mascots ({mascots.length})
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shields" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Shield Templates</h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">{shields.length} shields available</p>
                <Button size="sm" onClick={loadAssets} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
            {shields.length > 0 ? (
              <AssetGrid assets={shields} type="shield" />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No shields uploaded yet</h3>
                  <p className="text-gray-600 mb-4">Upload your first shield template to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mascots" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mascot Designs</h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">{mascots.length} mascots available</p>
                <Button size="sm" onClick={loadAssets} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
            {mascots.length > 0 ? (
              <AssetGrid assets={mascots} type="mascot" />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No mascots uploaded yet</h3>
                  <p className="text-gray-600 mb-4">Upload your first mascot design to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <UploadSection type="shield" />
              <UploadSection type="mascot" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
