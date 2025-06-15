"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"

interface LogoBuilderProps {
  onLogoUpdate?: (logoUrl: string) => void
}

const LogoBuilder: React.FC<LogoBuilderProps> = ({ onLogoUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null)
  const [selectedShield, setSelectedShield] = useState<string | null>(null)
  const [teamName, setTeamName] = useState("Your Team")
  const [textColor, setTextColor] = useState("#FFFFFF")
  const [shieldColor, setShieldColor] = useState("#3B82F6")

  // Position controls
  const [mascotPosition, setMascotPosition] = useState({ x: 50, y: 40 }) // Percentage based
  const [textPosition, setTextPosition] = useState({ x: 50, y: 85 }) // Percentage based
  const [mascotSize, setMascotSize] = useState(40) // Percentage of canvas
  const [textSize, setTextSize] = useState(40) // Font size

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const CANVAS_WIDTH = 500
    const CANVAS_HEIGHT = 500
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Function to draw the logo
    const drawLogo = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Helper function to draw mascot and text
      function drawMascotAndText() {
        // Draw mascot
        if (selectedMascot) {
          const mascotImg = new Image()
          mascotImg.crossOrigin = "anonymous"
          mascotImg.onload = () => {
            const mascotSizePixels = (canvas.width * mascotSize) / 100
            const mascotX = (canvas.width * mascotPosition.x) / 100 - mascotSizePixels / 2
            const mascotY = (canvas.height * mascotPosition.y) / 100 - mascotSizePixels / 2

            ctx.drawImage(mascotImg, mascotX, mascotY, mascotSizePixels, mascotSizePixels)

            // Draw team name
            ctx.font = `${textSize}px Impact, sans-serif`
            ctx.fillStyle = textColor
            ctx.textAlign = "center"
            const textX = (canvas.width * textPosition.x) / 100
            const textY = (canvas.height * textPosition.y) / 100
            ctx.fillText(teamName, textX, textY)

            // Trigger logo update
            const logoUrl = canvas.toDataURL("image/png")
            onLogoUpdate?.(logoUrl)
          }
          mascotImg.onerror = () => {
            console.error("Failed to load mascot image:", selectedMascot)
            // Continue with text drawing even if mascot fails to load
            ctx.font = `${textSize}px Impact, sans-serif`
            ctx.fillStyle = textColor
            ctx.textAlign = "center"
            const textX = (canvas.width * textPosition.x) / 100
            const textY = (canvas.height * textPosition.y) / 100
            ctx.fillText(teamName, textX, textY)
            onLogoUpdate?.(canvas.toDataURL("image/png"))
          }
          mascotImg.src = selectedMascot
        } else {
          // Draw team name only
          ctx.font = `${textSize}px Impact, sans-serif`
          ctx.fillStyle = textColor
          ctx.textAlign = "center"
          const textX = (canvas.width * textPosition.x) / 100
          const textY = (canvas.height * textPosition.y) / 100
          ctx.fillText(teamName, textX, textY)

          // Trigger logo update
          const logoUrl = canvas.toDataURL("image/png")
          onLogoUpdate?.(logoUrl)
        }
      }

      // Draw shield with color overlay
      if (selectedShield) {
        const shieldImg = new Image()
        shieldImg.crossOrigin = "anonymous"
        shieldImg.onload = () => {
          // Create a temporary canvas for color overlay
          const tempCanvas = document.createElement("canvas")
          const tempCtx = tempCanvas.getContext("2d")
          tempCanvas.width = canvas.width
          tempCanvas.height = canvas.height

          // Draw the shield
          tempCtx.drawImage(shieldImg, 0, 0, canvas.width, canvas.height)

          // Apply color overlay using multiply blend mode
          tempCtx.globalCompositeOperation = "multiply"
          tempCtx.fillStyle = shieldColor
          tempCtx.fillRect(0, 0, canvas.width, canvas.height)

          // Reset blend mode and draw to main canvas
          tempCtx.globalCompositeOperation = "destination-over"
          tempCtx.fillStyle = "#FFFFFF"
          tempCtx.fillRect(0, 0, canvas.width, canvas.height)

          ctx.drawImage(tempCanvas, 0, 0)

          // Continue with mascot and text drawing...
          drawMascotAndText()
        }
        shieldImg.onerror = () => {
          console.error("Failed to load shield image:", selectedShield)
          // Continue with mascot and text drawing even if shield fails to load
          drawMascotAndText()
        }
        shieldImg.src = selectedShield
      } else {
        drawMascotAndText()
      }
    }

    drawLogo()
  }, [
    selectedMascot,
    selectedShield,
    teamName,
    textColor,
    shieldColor,
    mascotPosition,
    textPosition,
    mascotSize,
    textSize,
    onLogoUpdate,
  ])

  const handleMascotSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMascot(event.target.value === "" ? null : event.target.value)
  }

  const handleShieldSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShield(event.target.value === "" ? null : event.target.value)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Basic Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Options</h3>

        {/* Mascot Select */}
        <div className="space-y-2">
          <Label>Mascot</Label>
          <select className="w-full p-2 border rounded" onChange={handleMascotSelect} defaultValue="">
            <option value="">None</option>
            <option value="/images/mascots/cowboy.png">Cowboy</option>
            <option value="/images/mascots/rooster.png">Rooster</option>
            <option value="/images/mascots/tiger.png">Tiger</option>
            <option value="/images/mascots/pirate.png">Pirate</option>
            <option value="/images/mascots/moose.png">Moose</option>
            <option value="/images/teams/glenroy.png">Glenroy Jersey</option>
            <option value="/images/teams/avondale-heights.png">Avondale Heights Jersey</option>
          </select>
        </div>

        {/* Shield Select */}
        <div className="space-y-2">
          <Label>Shield</Label>
          <select className="w-full p-2 border rounded" onChange={handleShieldSelect} defaultValue="">
            <option value="">None</option>
            <option value="/images/shield-templates/team1.png">Shield Template 1</option>
            <option value="/images/shield-templates/team2.png">Shield Template 2</option>
          </select>
        </div>

        {/* Team Name Input */}
        <div className="space-y-2">
          <Label>Team Name</Label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>

        {/* Text Color Picker */}
        <div className="space-y-2">
          <Label>Text Color</Label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <span className="text-sm text-gray-600">{textColor}</span>
          </div>
        </div>

        {/* Shield Color Picker */}
        <div className="space-y-2">
          <Label>Shield Color</Label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={shieldColor}
              onChange={(e) => setShieldColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <span className="text-sm text-gray-600">{shieldColor}</span>
          </div>
        </div>
      </div>

      {/* Column 2: Canvas */}
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="border border-gray-300" />
      </div>

      {/* Column 3: Position Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Position Controls</h3>

        {/* Mascot Position */}
        <div className="space-y-3">
          <Label>Mascot Position</Label>
          <div className="space-y-2">
            <div>
              <Label className="text-sm">Horizontal: {mascotPosition.x}%</Label>
              <input
                type="range"
                min="10"
                max="90"
                value={mascotPosition.x}
                onChange={(e) => setMascotPosition((prev) => ({ ...prev, x: Number.parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-sm">Vertical: {mascotPosition.y}%</Label>
              <input
                type="range"
                min="10"
                max="70"
                value={mascotPosition.y}
                onChange={(e) => setMascotPosition((prev) => ({ ...prev, y: Number.parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Mascot Size */}
        <div className="space-y-2">
          <Label>Mascot Size: {mascotSize}%</Label>
          <input
            type="range"
            min="20"
            max="80"
            value={mascotSize}
            onChange={(e) => setMascotSize(Number.parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Text Position */}
        <div className="space-y-3">
          <Label>Text Position</Label>
          <div className="space-y-2">
            <div>
              <Label className="text-sm">Horizontal: {textPosition.x}%</Label>
              <input
                type="range"
                min="10"
                max="90"
                value={textPosition.x}
                onChange={(e) => setTextPosition((prev) => ({ ...prev, x: Number.parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-sm">Vertical: {textPosition.y}%</Label>
              <input
                type="range"
                min="30"
                max="95"
                value={textPosition.y}
                onChange={(e) => setTextPosition((prev) => ({ ...prev, y: Number.parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Text Size */}
        <div className="space-y-2">
          <Label>Text Size: {textSize}px</Label>
          <input
            type="range"
            min="20"
            max="80"
            value={textSize}
            onChange={(e) => setTextSize(Number.parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Quick Position Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMascotPosition({ x: 50, y: 30 })
                setTextPosition({ x: 50, y: 85 })
              }}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
            >
              Top/Bottom
            </button>
            <button
              onClick={() => {
                setMascotPosition({ x: 30, y: 50 })
                setTextPosition({ x: 70, y: 50 })
              }}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
            >
              Left/Right
            </button>
            <button
              onClick={() => {
                setMascotPosition({ x: 50, y: 40 })
                setTextPosition({ x: 50, y: 70 })
              }}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
            >
              Center Stack
            </button>
            <button
              onClick={() => {
                setMascotPosition({ x: 65, y: 35 })
                setTextPosition({ x: 35, y: 65 })
              }}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
            >
              Diagonal
            </button>
          </div>
        </div>
      </div>
      {/* Save Logo to Team */}
      <div className="space-y-2">
        <Label>Save Logo</Label>
        <button
          onClick={() => {
            const canvas = canvasRef.current
            if (canvas && onLogoUpdate) {
              const logoUrl = canvas.toDataURL("image/png")
              onLogoUpdate(logoUrl)
              // Save to localStorage for the team
              const teamData = JSON.parse(localStorage.getItem("fantasyTeam") || "{}")
              teamData.logoUrl = logoUrl
              localStorage.setItem("fantasyTeam", JSON.stringify(teamData))
              alert("Logo saved to your team!")
            }
          }}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Logo to Team
        </button>
      </div>
    </div>
  )
}

export default LogoBuilder
