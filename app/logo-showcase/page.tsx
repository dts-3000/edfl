"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/layout/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Download, Share2, Edit } from "lucide-react"

interface SavedLogo {
  id: string
  name: string
  logoUrl: string
  createdAt: string
  teamName: string
}

export default function LogoShowcasePage() {
  const [savedLogos, setSavedLogos] = useState<SavedLogo[]>([])
  const [currentTeamLogo, setCurrentTeamLogo] = useState<string | null>(null)

  useEffect(() => {
    // Load current team logo
    const teamData = JSON.parse(localStorage.getItem("fantasyTeam") || "{}")
    if (teamData.logoUrl) {
      setCurrentTeamLogo(teamData.logoUrl)
    }

    // Load saved logos from localStorage
    const saved = JSON.parse(localStorage.getItem("savedLogos") || "[]")
    setSavedLogos(saved)
  }, [])

  const downloadLogo = (logoUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.download = `${fileName}.png`
    link.href = logoUrl
    link.click()
  }

  const shareTeamLogo = async () => {
    if (currentTeamLogo && navigator.share) {
      try {
        // Convert data URL to blob
        const response = await fetch(currentTeamLogo)
        const blob = await response.blob()
        const file = new File([blob], "team-logo.png", { type: "image/png" })

        await navigator.share({
          title: "My EDFL Fantasy Team Logo",
          files: [file],
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Logo Showcase</h1>
          <Link href="/account/logo-builder">
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Create New Logo
            </Button>
          </Link>
        </div>

        {/* Current Team Logo */}
        {currentTeamLogo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Current Team Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                  <img
                    src={currentTeamLogo || "/placeholder.svg"}
                    alt="Current Team Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Active Team Logo</h3>
                  <p className="text-gray-600 mb-4">This logo represents your fantasy team across the app.</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => downloadLogo(currentTeamLogo, "my-team-logo")}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    {navigator.share && (
                      <Button variant="outline" onClick={shareTeamLogo}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    )}
                    <Link href="/account/logo-builder">
                      <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logo Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedLogos.length > 0 ? (
            savedLogos.map((logo) => (
              <Card key={logo.id}>
                <CardContent className="p-4">
                  <div className="w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-white mb-4">
                    <img
                      src={logo.logoUrl || "/placeholder.svg"}
                      alt={logo.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-semibold mb-1">{logo.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">Created: {new Date(logo.createdAt).toLocaleDateString()}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => downloadLogo(logo.logoUrl, logo.name)}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <Edit className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved logos yet</h3>
              <p className="text-gray-600 mb-4">Create your first team logo to get started!</p>
              <Link href="/account/logo-builder">
                <Button>Create Logo</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
