"use client"

import { useState, useEffect } from "react"
import { type Player, type TeamData, defaultTeamData, loadTeamData } from "@/lib/teamData"
import { fetchPlayerData } from "@/lib/playerData"
import TeamHeader from "@/components/team-builder/TeamHeader"
import TeamTabs from "@/components/team-builder/TeamTabs"
import AvailablePlayers from "@/components/team-builder/AvailablePlayers"
import TeamVisualization from "@/components/team-builder/TeamVisualization"
import MyTeam from "@/components/team-builder/MyTeam"
import LogoBuilder from "@/components/team-builder/LogoBuilder"
import Navbar from "@/components/layout/Navbar"
import { toast } from "@/components/ui/use-toast"
import TeamLogoDisplay from "@/components/team-builder/TeamLogoDisplay"

// Define the new salary cap as a constant
const SALARY_CAP = 6830000

export default function TeamBuilderPage() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [teamData, setTeamData] = useState<TeamData>({ ...defaultTeamData, budget: SALARY_CAP })
  const [activeTab, setActiveTab] = useState("builder")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)

  // Preload critical images
  useEffect(() => {
    const imagesToPreload = ["/images/oval.png", "/images/teams/placeholder.png", "/images/oval-fallback.png"]

    let loadedCount = 0
    const totalImages = imagesToPreload.length

    imagesToPreload.forEach((src) => {
      const img = new Image()
      img.onload = () => {
        loadedCount++
        if (loadedCount === totalImages) {
          setImagesPreloaded(true)
        }
      }
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`)
        loadedCount++
        if (loadedCount === totalImages) {
          setImagesPreloaded(true)
        }
      }
      img.src = src
    })
  }, [])

  // Update existing team data in localStorage to use the new salary cap
  useEffect(() => {
    const updateSalaryCap = async () => {
      try {
        const savedTeam = localStorage.getItem("fantasyTeam")
        if (savedTeam) {
          const parsedTeam = JSON.parse(savedTeam)
          if (parsedTeam.budget !== SALARY_CAP || parsedTeam.budget === 140000 || parsedTeam.budget === 130000) {
            parsedTeam.budget = SALARY_CAP
            localStorage.setItem("fantasyTeam", JSON.stringify(parsedTeam))
            console.log("Updated team budget to", SALARY_CAP)
          }
        }
      } catch (error) {
        console.error("Error updating salary cap:", error)
      }
    }

    updateSalaryCap()
  }, [])

  // Load player data from Firebase registry
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        console.log("Loading players from Firebase registry...")
        console.log("Current SALARY_CAP:", SALARY_CAP)
        const players = await fetchPlayerData()
        console.log(`Loaded ${players.length} players from Firebase registry`)
        setAllPlayers(players)

        // Load saved team from localStorage with updated budget
        const teamData = await loadTeamData()

        // Force the budget to be the new salary cap
        teamData.budget = SALARY_CAP

        setTeamData(teamData)

        // Mark selected players in the allPlayers list using registry IDs
        const selectedRegistryIds = teamData.players.map((p: Player) => p.registryId || p.id)
        setAllPlayers(
          players.map((p) => ({
            ...p,
            selected: selectedRegistryIds.includes(p.registryId),
          })),
        )

        setLoading(false)
      } catch (err) {
        console.error("Error loading player data:", err)
        setError("Failed to load player data. Please try again later.")
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Add player to team using registry ID
  const handleAddPlayer = (player: Player) => {
    // Check position limits
    const positionCounts = {
      DEF: teamData.players.filter((p) => p.position === "DEF").length,
      MID: teamData.players.filter((p) => p.position === "MID").length,
      RUC: teamData.players.filter((p) => p.position === "RUC").length,
      FWD: teamData.players.filter((p) => p.position === "FWD").length,
    }

    const positionLimits = {
      DEF: 6,
      MID: 5,
      RUC: 1,
      FWD: 6,
    }

    if (
      positionCounts[player.position as keyof typeof positionCounts] >=
      positionLimits[player.position as keyof typeof positionLimits]
    ) {
      toast({
        title: "Position Limit Reached",
        description: `You can't add more ${player.position} players. Maximum is ${positionLimits[player.position as keyof typeof positionLimits]}.`,
        variant: "destructive",
      })
      return
    }

    // Check salary cap
    const currentSalary = teamData.players.reduce((sum, p) => sum + p.price, 0)
    if (currentSalary + player.price > SALARY_CAP) {
      toast({
        title: "Salary Cap Exceeded",
        description: "Adding this player would exceed your salary cap.",
        variant: "destructive",
      })
      return
    }

    // Add player to team with registry ID as primary identifier
    const updatedPlayer = {
      ...player,
      selected: true,
      id: player.registryId, // Use registry ID as primary ID
    }
    const updatedTeamData = {
      ...teamData,
      budget: SALARY_CAP,
      players: [...teamData.players, updatedPlayer],
      lastUpdated: Date.now(),
    }
    setTeamData(updatedTeamData)

    // Save to localStorage immediately
    localStorage.setItem("fantasyTeam", JSON.stringify(updatedTeamData))

    // Update the allPlayers list to mark this player as selected
    setAllPlayers((prev) => prev.map((p) => (p.registryId === player.registryId ? { ...p, selected: true } : p)))
  }

  // Remove player from team using registry ID
  const handleRemovePlayer = (playerId: string) => {
    // If removing the captain, clear the captain field
    const updatedTeamData = {
      ...teamData,
      budget: SALARY_CAP,
      players: teamData.players.filter((p) => p.registryId !== playerId && p.id !== playerId),
      captain: teamData.captain === playerId ? undefined : teamData.captain,
      lastUpdated: Date.now(),
    }

    setTeamData(updatedTeamData)

    // Save to localStorage immediately
    localStorage.setItem("fantasyTeam", JSON.stringify(updatedTeamData))

    // Update the allPlayers list to mark this player as not selected
    setAllPlayers((prev) =>
      prev.map((p) => (p.registryId === playerId || p.id === playerId ? { ...p, selected: false } : p)),
    )
  }

  // Set captain using registry ID
  const handleSetCaptain = (playerId: string) => {
    const updatedTeamData = {
      ...teamData,
      budget: SALARY_CAP,
      captain: teamData.captain === playerId ? undefined : playerId,
      lastUpdated: Date.now(),
    }
    setTeamData(updatedTeamData)

    // Save to localStorage immediately
    localStorage.setItem("fantasyTeam", JSON.stringify(updatedTeamData))
  }

  // Save team
  const handleSaveTeam = async () => {
    setSaving(true)
    try {
      // Ensure the budget is set to the new salary cap
      const teamToSave = {
        ...teamData,
        budget: SALARY_CAP,
      }

      // Save directly to localStorage with the correct key
      localStorage.setItem("fantasyTeam", JSON.stringify(teamToSave))
      const success = true
      if (success) {
        toast({
          title: "Team Saved",
          description: "Your team has been saved successfully.",
        })
      } else {
        toast({
          title: "Save Failed",
          description: "There was an error saving your team. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving team:", error)
      toast({
        title: "Save Failed",
        description: "There was an error saving your team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle logo updates
  const handleLogoUpdate = (logoUrl: string) => {
    const updatedTeamData = {
      ...teamData,
      logoUrl,
      lastUpdated: Date.now(),
    }
    setTeamData(updatedTeamData)
    localStorage.setItem("fantasyTeam", JSON.stringify(updatedTeamData))
  }

  // Clear team
  const handleClearTeam = () => {
    if (teamData.players.length === 0) {
      toast({
        title: "Team Already Empty",
        description: "There are no players to remove from your team.",
      })
      return
    }

    if (confirm("Are you sure you want to clear your entire team? This action cannot be undone.")) {
      // Create a new team data object with empty players array
      const clearedTeamData = {
        ...teamData,
        budget: SALARY_CAP,
        players: [],
        captain: undefined,
        lastUpdated: Date.now(),
      }

      // Update state
      setTeamData(clearedTeamData)

      // Save to localStorage
      localStorage.setItem("fantasyTeam", JSON.stringify(clearedTeamData))

      // Update allPlayers to mark all as not selected
      setAllPlayers((prev) => prev.map((p) => ({ ...p, selected: false })))

      toast({
        title: "Team Cleared",
        description: "All players have been removed from your team.",
      })
    }
  }

  // Calculate remaining salary
  const remainingSalary = SALARY_CAP - teamData.players.reduce((sum, player) => sum + player.price, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading player data from Firebase registry...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-2">Error</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <TeamHeader teamData={{ ...teamData, budget: SALARY_CAP }} remainingSalary={remainingSalary} />
          <div className="flex items-center space-x-4">
            {/* Team Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="bg-white px-3 py-1 rounded-md shadow-sm border">
                <span className="text-gray-600">Remaining:</span>
                <span className={`ml-1 font-semibold ${remainingSalary < 0 ? "text-red-600" : "text-green-600"}`}>
                  ${remainingSalary.toLocaleString()}
                </span>
              </div>
              <div className="bg-white px-3 py-1 rounded-md shadow-sm border">
                <span className="text-gray-600">Players:</span>
                <span className="ml-1 font-semibold text-blue-600">{teamData.players.length}/18</span>
              </div>
              <div className="bg-white px-3 py-1 rounded-md shadow-sm border">
                <span className="text-gray-600">Positions:</span>
                <span className="ml-1 font-semibold text-purple-600">
                  DEF {teamData.players.filter((p) => p.position === "DEF").length}/6, MID{" "}
                  {teamData.players.filter((p) => p.position === "MID").length}/5, RUC{" "}
                  {teamData.players.filter((p) => p.position === "RUC").length}/1, FWD{" "}
                  {teamData.players.filter((p) => p.position === "FWD").length}/6
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleClearTeam}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Team
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={saving}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                  "Save Team"
                )}
              </button>
            </div>
          </div>
        </div>

        <TeamTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === "builder" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <AvailablePlayers
                  players={allPlayers}
                  onAddPlayer={handleAddPlayer}
                  selectedPlayerIds={teamData.players.map((p) => p.registryId || p.id)}
                />
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                  <h2 className="text-sm font-semibold mb-2">Team Visualization</h2>
                  <TeamVisualization
                    selectedPlayers={teamData.players}
                    captain={teamData.captain || null}
                    onSetCaptain={handleSetCaptain}
                    onRemovePlayer={handleRemovePlayer}
                  />
                </div>

                <MyTeam
                  players={teamData.players}
                  onRemovePlayer={handleRemovePlayer}
                  captain={teamData.captain || null}
                  onSetCaptain={handleSetCaptain}
                />
              </div>
            </div>
          )}

          {activeTab === "logo" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <TeamLogoDisplay teamData={teamData} onLogoUpdate={handleLogoUpdate} />
              </div>
              <div className="lg:col-span-3">
                <LogoBuilder onLogoUpdate={handleLogoUpdate} />
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Player Stats</h2>
              <p className="text-gray-600">Player statistics will be displayed here.</p>
            </div>
          )}

          {activeTab === "projections" && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Projections</h2>
              <p className="text-gray-600">Player projections will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
