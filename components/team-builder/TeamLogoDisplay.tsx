"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface TeamLogoDisplayProps {
  teamData: any
  onLogoUpdate?: (logoUrl: string) => void
}

export default function TeamLogoDisplay({ teamData, onLogoUpdate }: TeamLogoDisplayProps) {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)

  useEffect(() => {
    // Load saved logo from team data
    if (teamData?.logoUrl) {
      setCurrentLogo(teamData.logoUrl)
    }
  }, [teamData])

  const handleLogoUpdate = (logoUrl: string) => {
    setCurrentLogo(logoUrl)
    onLogoUpdate?.(logoUrl)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Logo</span>
          <Link href="/account/logo-builder">
            <Button variant="outline" size="sm">
              Edit Logo
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {currentLogo ? (
            <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
              <img src={currentLogo || "/placeholder.svg"} alt="Team Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-gray-400 text-sm">No Logo</div>
                <div className="text-gray-400 text-xs">Create one!</div>
              </div>
            </div>
          )}

          <div className="text-center">
            <h3 className="font-semibold">{teamData?.teamName || "My EDFL Team"}</h3>
            {teamData?.teamMotto && <p className="text-sm text-gray-600 italic">"{teamData.teamMotto}"</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
