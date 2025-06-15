"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Download, Copy, Save } from "lucide-react"
import { toast } from "sonner"
import { loadTeamData, saveTeamData } from "@/lib/teamData"

export interface LogoConfig {
  teamName: string
  primaryColor: string
  secondaryColor: string
  mascot: string
  style: string
  mascotSize: number
  textSize: number
}

const DEFAULT_CONFIG: LogoConfig = {
  teamName: "EDFL Warriors",
  primaryColor: "#1e40af",
  secondaryColor: "#ffffff",
  mascot: "knight",
  style: "shield",
  mascotSize: 80,
  textSize: 24,
}

export default function LogoCreator() {
  const [config, setConfig] = useState<LogoConfig>(DEFAULT_CONFIG)
  const [teamData, setTeamData] = useState<any>(null)
  const [savingToTeam, setSavingToTeam] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Load team data on component mount
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const data = await loadTeamData()
        setTeamData(data)

        // If team has a name, update the logo name
        if (data.teamName && data.teamName !== "My EDFL Team") {
          setConfig((prev) => ({ ...prev, teamName: data.teamName }))
        }
      } catch (error) {
        console.error("Error loading team data:", error)
      }
    }

    fetchTeamData()
  }, [])

  const updateConfig = (updates: Partial<LogoConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const handleDownload = () => {
    // Generate a data URL from the logo container
    generateLogoImage()
    toast.success("Logo downloaded successfully!")
  }

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    toast.success("Configuration copied to clipboard!")
  }

  // Function to save logo to team
  const handleSaveToTeam = async () => {
    if (!teamData) {
      toast.error("Team data not found. Please create a team first.")
      return
    }

    setSavingToTeam(true)
    try {
      // Generate logo image
      const logoImage = await generateLogoImage()

      if (!logoImage) {
        throw new Error("Failed to generate logo image")
      }

      // Update team data with new logo
      const updatedTeamData = {
        ...teamData,
        logoUrl: logoImage,
        teamName: config.teamName, // Also update team name if changed
        lastUpdated: Date.now(),
      }

      // Save to localStorage
      await saveTeamData(updatedTeamData)

      toast.success("Logo saved to your team!", {
        description: "Your team logo has been updated successfully.",
      })

      // Update local state
      setTeamData(updatedTeamData)
    } catch (error) {
      console.error("Error saving logo to team:", error)
      toast.error("Failed to save logo to team", {
        description: "Please try again or check console for errors.",
      })
    } finally {
      setSavingToTeam(false)
    }
  }

  // Function to generate logo image as data URL
  const generateLogoImage = async (): Promise<string | null> => {
    try {
      const logoContainer = document.getElementById("logo-preview-container")
      if (!logoContainer) {
        throw new Error("Logo container not found")
      }

      // Create a canvas to draw the logo
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Set canvas size
      canvas.width = 320
      canvas.height = 320

      // Get the container styles
      const containerStyle = getContainerStyle()

      // Draw background
      if (containerStyle.background) {
        // Extract primary color from gradient or use solid color
        const bgColor = config.primaryColor
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Load and draw mascot image
      if (config.mascot) {
        try {
          const mascotImg = new Image()
          mascotImg.crossOrigin = "anonymous"

          await new Promise((resolve, reject) => {
            mascotImg.onload = resolve
            mascotImg.onerror = reject
            mascotImg.src = `/images/mascots/${config.mascot}.png`
          })

          // Calculate mascot position (centered, above text)
          const mascotSize = (config.mascotSize / 80) * 120 // Scale for canvas
          const mascotX = (canvas.width - mascotSize) / 2
          const mascotY = (canvas.height - mascotSize) / 2 - 20

          ctx.drawImage(mascotImg, mascotX, mascotY, mascotSize, mascotSize)
        } catch (error) {
          console.warn("Could not load mascot image:", error)
        }
      }

      // Draw text
      if (config.teamName) {
        ctx.fillStyle = config.secondaryColor
        ctx.font = `bold ${(config.textSize / 24) * 28}px Oswald, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Add text shadow
        ctx.shadowColor = "rgba(0,0,0,0.3)"
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        // Draw text at bottom
        const textY = canvas.height - 40
        ctx.fillText(config.teamName, canvas.width / 2, textY)
      }

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/png")
      setLogoUrl(dataUrl)

      return dataUrl
    } catch (error) {
      console.error("Error generating logo image:", error)
      return null
    }
  }

  const logoStyles = [
    "Shield",
    "Badge",
    "Emblem",
    "Crest",
    "Text",
    "Modern",
    "Neon",
    "Raised",
    "Shadow",
    "Layered",
    "Beveled",
    "Glass",
    "Metallic",
    "Holographic",
  ]

  const mascots = [
    // Warriors & Characters
    { id: "knight", name: "Knight" },
    { id: "spartan", name: "Spartan" },
    { id: "spartan1", name: "Spartan1" },
    { id: "roman", name: "Roman" },
    { id: "miner", name: "Miner" },
    { id: "pirate", name: "Pirate" },
    { id: "cowboy", name: "Cowboy" },
    { id: "bandit", name: "Bandit" },
    { id: "madclown", name: "Clown" },

    // Big Cats
    { id: "tiger", name: "Tiger" },
    { id: "tiger2", name: "Tiger2" },
    { id: "tiger3", name: "Tiger3" },
    { id: "panther", name: "Panther" },
    { id: "cat", name: "Cat" },
    { id: "blue_lion", name: "Lion" },

    // Birds
    { id: "eagle", name: "Eagle" },
    { id: "eagle1", name: "Eagle1" },
    { id: "rooster", name: "Rooster" },
    { id: "bee", name: "Bee" },

    // Large Animals
    { id: "gorilla", name: "Gorilla" },
    { id: "elephant", name: "Elephant" },
    { id: "bull", name: "Bull" },
    { id: "moose", name: "Moose" },
    { id: "beaver", name: "Beaver" },
    { id: "colt", name: "Colt" },
    { id: "colt1", name: "Colt Shield" },
    { id: "colt3", name: "Running Horse" },

    // Reptiles
    { id: "gator", name: "Gator" },
    { id: "snake", name: "Snake" },
    { id: "rattler", name: "Rattler" },

    // Elements
    { id: "storm", name: "Storm" },

    // Food
    { id: "burger", name: "Burger" },
    { id: "chips", name: "Chips" },
    { id: "donut", name: "Donut" },
    { id: "hotdog", name: "Hotdog" },
  ]

  // Expanded primary colors palette
  const primaryColors = [
    // Blues
    "#1e40af",
    "#3b82f6",
    "#0ea5e9",
    "#0891b2",
    "#06b6d4",
    "#0284c7",
    "#075985",
    "#0c4a6e",
    // Reds
    "#dc2626",
    "#ef4444",
    "#f87171",
    "#be123c",
    "#e11d48",
    "#f43f5e",
    "#991b1b",
    "#7f1d1d",
    // Greens
    "#059669",
    "#10b981",
    "#16a34a",
    "#22c55e",
    "#84cc16",
    "#65a30d",
    "#4d7c0f",
    "#365314",
    // Purples
    "#7e22ce",
    "#8b5cf6",
    "#a855f7",
    "#9333ea",
    "#7c3aed",
    "#6d28d9",
    "#5b21b6",
    "#4c1d95",
    // Oranges
    "#ea580c",
    "#f97316",
    "#fb923c",
    "#fdba74",
    "#fed7aa",
    "#c2410c",
    "#9a3412",
    "#7c2d12",
    // Yellows
    "#fbbf24",
    "#f59e0b",
    "#eab308",
    "#facc15",
    "#fde047",
    "#d97706",
    "#b45309",
    "#92400e",
    // Pinks
    "#d946ef",
    "#e879f9",
    "#f0abfc",
    "#ec4899",
    "#f472b6",
    "#be185d",
    "#9d174d",
    "#831843",
    // Grays
    "#000000",
    "#1f2937",
    "#374151",
    "#4b5563",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#f3f4f6",
    // Teals
    "#14b8a6",
    "#5eead4",
    "#2dd4bf",
    "#0f766e",
    "#134e4a",
    "#115e59",
    "#0d9488",
    "#0f766e",
    // Indigos
    "#4338ca",
    "#6366f1",
    "#818cf8",
    "#a5b4fc",
    "#3730a3",
    "#312e81",
    "#1e1b4b",
    "#1e3a8a",
    // Emeralds
    "#047857",
    "#059669",
    "#10b981",
    "#34d399",
    "#6ee7b7",
    "#064e3b",
    "#065f46",
    "#047857",
    // Rose
    "#be123c",
    "#e11d48",
    "#f43f5e",
    "#fb7185",
    "#fda4af",
    "#9f1239",
    "#881337",
    "#4c0519",
  ]

  // Expanded secondary colors palette
  const secondaryColors = [
    // Whites & Light Grays
    "#ffffff",
    "#f8fafc",
    "#f1f5f9",
    "#e2e8f0",
    "#cbd5e1",
    "#94a3b8",
    // Blacks & Dark Grays
    "#000000",
    "#0f172a",
    "#1e293b",
    "#334155",
    "#475569",
    "#64748b",
    // Warm Neutrals
    "#fef7ed",
    "#fed7aa",
    "#fdba74",
    "#fb923c",
    "#f97316",
    "#ea580c",
    // Cool Neutrals
    "#f0f9ff",
    "#e0f2fe",
    "#bae6fd",
    "#7dd3fc",
    "#38bdf8",
    "#0ea5e9",
    // Cream & Beige
    "#fefce8",
    "#fef3c7",
    "#fde68a",
    "#fcd34d",
    "#f59e0b",
    "#d97706",
    // Light Colors
    "#ecfdf5",
    "#d1fae5",
    "#a7f3d0",
    "#6ee7b7",
    "#34d399",
    "#10b981",
  ]

  // Get container styles based on selected style
  const getContainerStyle = () => {
    const baseStyle = {
      background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)`,
    }

    switch (config.style) {
      case "shield":
        return {
          background: `linear-gradient(135deg, #d4af37 0%, #ffd700 25%, ${config.primaryColor} 50%, #b8860b 75%, #8b6914 100%)`,
          clipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
          border: "3px solid #8b6914",
          boxShadow: "inset 0 0 20px rgba(255,215,0,0.3), 0 8px 16px rgba(0,0,0,0.3)",
          position: "relative",
        }
      case "badge":
        return {
          ...baseStyle,
          borderRadius: "50%",
          border: `4px solid ${config.secondaryColor}`,
          boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
        }
      case "emblem":
        return {
          ...baseStyle,
          borderRadius: "20px",
          border: `3px solid ${config.secondaryColor}`,
          boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
        }
      case "crest":
        return {
          ...baseStyle,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          border: `2px solid ${config.secondaryColor}`,
        }
      case "text":
        return {
          ...baseStyle,
          background: "transparent",
          boxShadow: "none",
        }
      case "modern":
        return {
          ...baseStyle,
          borderRadius: "12px",
          borderLeft: `6px solid ${config.secondaryColor}`,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }
      case "neon":
        return {
          ...baseStyle,
          boxShadow: `0 0 10px ${config.primaryColor}, 0 0 20px ${config.primaryColor}, 0 0 30px ${config.primaryColor}`,
          border: `2px solid ${config.secondaryColor}`,
          borderRadius: "12px",
        }
      case "raised":
        return {
          ...baseStyle,
          borderRadius: "12px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.3), 0 4px 4px rgba(0,0,0,0.2)",
          transform: "translateY(-4px)",
        }
      case "shadow":
        return {
          ...baseStyle,
          borderRadius: "12px",
          boxShadow: "8px 8px 15px rgba(0,0,0,0.5)",
        }
      case "layered":
        return {
          ...baseStyle,
          borderRadius: "12px",
          boxShadow:
            "0 1px 1px rgba(0,0,0,0.12), 0 2px 2px rgba(0,0,0,0.12), 0 4px 4px rgba(0,0,0,0.12), 0 8px 8px rgba(0,0,0,0.12), 0 16px 16px rgba(0,0,0,0.12)",
        }
      case "beveled":
        return {
          ...baseStyle,
          borderRadius: "12px",
          boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.4), inset -2px -2px 5px rgba(0,0,0,0.4)",
          border: `2px solid ${config.secondaryColor}`,
        }
      case "glass":
        return {
          background: `linear-gradient(135deg, ${config.primaryColor}80, ${config.primaryColor}40)`,
          backdropFilter: "blur(10px)",
          border: `1px solid ${config.secondaryColor}40`,
          borderRadius: "16px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }
      case "metallic":
        return {
          background: `linear-gradient(135deg, #c0c0c0, ${config.primaryColor}, #c0c0c0)`,
          borderRadius: "12px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          border: `2px solid ${config.secondaryColor}`,
        }
      case "holographic":
        return {
          background: `linear-gradient(45deg, ${config.primaryColor}, #ff8c00, #40e0d0, ${config.primaryColor})`,
          backgroundSize: "400% 400%",
          animation: "holographic 3s ease-in-out infinite",
          borderRadius: "12px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          border: `2px solid ${config.secondaryColor}`,
        }
      default:
        return baseStyle
    }
  }

  // Get text styles based on selected style
  const getTextStyle = () => {
    return {
      color: config.secondaryColor,
      fontSize: `${config.textSize}px`,
      fontFamily: "Oswald, sans-serif",
      fontWeight: "bold",
      textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-[#f0f9f0] min-h-screen">
      {/* Column 1: Logo Preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div
              id="logo-preview-container"
              className="w-80 h-80 flex flex-col items-center justify-center mb-6 relative overflow-hidden"
              style={getContainerStyle()}
            >
              {config.mascot && (
                <img
                  src={`/images/mascots/${config.mascot}.png`}
                  alt={config.mascot}
                  style={{ width: `${config.mascotSize}px`, height: `${config.mascotSize}px` }}
                  className="object-contain mb-2 drop-shadow-lg"
                  onError={(e) => {
                    console.log(`Failed to load mascot: ${config.mascot}`)
                    e.currentTarget.style.display = "none"
                  }}
                />
              )}
              <div className="text-center drop-shadow-lg" style={getTextStyle()}>
                {config.teamName}
              </div>
            </div>

            <div className="w-full space-y-3">
              <h3 className="font-medium">Export Options</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex items-center justify-center bg-black text-white hover:bg-gray-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
                <Button onClick={handleCopyConfig} variant="outline" className="flex items-center justify-center">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Config
                </Button>
              </div>

              {/* Save to Team Button */}
              <Button
                onClick={handleSaveToTeam}
                disabled={savingToTeam}
                className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
              >
                {savingToTeam ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Team Logo
                  </>
                )}
              </Button>

              {teamData?.logoUrl && (
                <div className="text-xs text-center text-gray-500 mt-2">
                  {teamData.teamName ? `Current team: ${teamData.teamName}` : "Team logo will be updated"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column 2: Team Details & Controls */}
      <div className="space-y-6">
        {/* Team Details */}
        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={config.teamName}
                onChange={(e) => updateConfig({ teamName: e.target.value })}
                placeholder="Enter your team name"
                className="text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Size Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Size Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Mascot Size: {config.mascotSize}px</Label>
              <Slider
                value={[config.mascotSize]}
                onValueChange={(value) => updateConfig({ mascotSize: value[0] })}
                max={200}
                min={40}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label>Text Size: {config.textSize}px</Label>
              <Slider
                value={[config.textSize]}
                onValueChange={(value) => updateConfig({ textSize: value[0] })}
                max={36}
                min={12}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Icon & Symbol */}
        <Card>
          <CardHeader>
            <CardTitle>Icon & Symbol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Custom Mascots ({mascots.length} total)</Label>
              <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto border rounded p-2">
                {mascots.map((mascot) => (
                  <Button
                    key={mascot.id}
                    variant={config.mascot === mascot.id ? "default" : "outline"}
                    className="h-auto py-2 px-1 flex flex-col items-center"
                    onClick={() => updateConfig({ mascot: mascot.id })}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={`/images/mascots/${mascot.id}.png`}
                        alt={mascot.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.log(`Failed to load mascot button: ${mascot.id}`)
                          e.currentTarget.style.opacity = "0.3"
                        }}
                      />
                    </div>
                    <span className="text-xs mt-1">{mascot.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Logo Style & Colors */}
      <div className="space-y-6">
        {/* Logo Style */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {logoStyles.map((style) => (
                <Button
                  key={style}
                  variant={config.style === style.toLowerCase() ? "default" : "outline"}
                  className="h-10 text-sm"
                  onClick={() => updateConfig({ style: style.toLowerCase() })}
                >
                  {style}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Primary Color ({primaryColors.length} options)</Label>
              <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto border rounded p-2">
                {primaryColors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: config.primaryColor === color ? "#000" : "transparent",
                    }}
                    onClick={() => updateConfig({ primaryColor: color })}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Secondary Color ({secondaryColors.length} options)</Label>
              <div className="grid grid-cols-6 gap-1 max-h-24 overflow-y-auto border rounded p-2">
                {secondaryColors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: config.secondaryColor === color ? "#000" : "transparent",
                    }}
                    onClick={() => updateConfig({ secondaryColor: color })}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes holographic {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
