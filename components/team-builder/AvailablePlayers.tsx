"use client"

import type React from "react"

import { useState } from "react"
import type { Player } from "@/lib/teamData"
import { getTeamLogoPath } from "@/lib/teamLogos"
import PlayerInfoModal from "@/components/player-info/PlayerInfoModal"

interface AvailablePlayersProps {
  players: Player[]
  onAddPlayer: (player: Player) => void
  selectedPlayerIds?: string[]
}

export default function AvailablePlayers({ players, onAddPlayer, selectedPlayerIds = [] }: AvailablePlayersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState<string>("All")
  const [teamFilter, setTeamFilter] = useState<string>("All")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [sortBy, setSortBy] = useState<string>("price")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  // Get unique teams for filter
  const teams = ["All", ...Array.from(new Set(players.map((player) => player.team))).sort()]

  // Filter players - use registryId for selection check
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = positionFilter === "All" || player.position === positionFilter
    const matchesTeam = teamFilter === "All" || player.team === teamFilter
    const matchesStatus = statusFilter === "All" || player.status === statusFilter
    // Check both registryId and id for selected players
    const isNotSelected = !selectedPlayerIds.includes(player.registryId) && !selectedPlayerIds.includes(player.id)
    return matchesSearch && matchesPosition && matchesTeam && matchesStatus && isNotSelected
  })

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let comparison = 0
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy === "position") {
      comparison = a.position.localeCompare(b.position)
    } else if (sortBy === "team") {
      comparison = a.team.localeCompare(b.team)
    } else if (sortBy === "price") {
      comparison = a.price - b.price
    } else if (sortBy === "averageScore") {
      const aScore = a.averageScore || 0
      const bScore = b.averageScore || 0
      comparison = aScore - bScore
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const handleInfoClick = (player: Player) => {
    // Always use the Firebase registry ID for the modal
    setSelectedPlayer(player)
  }

  const handleCloseModal = () => {
    setSelectedPlayer(null)
  }

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  // Render status icon based on player status
  const renderStatusIcon = (status: string) => {
    if (status === "Selected in 22" || status === "Selected In 22") {
      return (
        <span
          className="inline-block w-4 h-4 bg-blue-100 text-blue-600 rounded-full text-center font-bold mr-1 cursor-help flex items-center justify-center text-xs"
          title="Selected in 22 - Player is selected in the team's 22-man squad"
          aria-label="Selected in 22"
        >
          ✓
        </span>
      )
    } else if (status === "VFL Listed") {
      return (
        <span
          className="inline-block px-1 py-0.5 bg-purple-100 text-purple-600 rounded text-center font-bold mr-1 cursor-help flex items-center justify-center text-xs"
          title="VFL Listed - Player is listed to play in the VFL"
          aria-label="VFL Listed"
        >
          VFL
        </span>
      )
    } else if (status === "Suspended") {
      return (
        <span
          className="inline-block w-4 h-4 bg-red-100 text-red-600 rounded-full text-center font-bold mr-1 cursor-help flex items-center justify-center text-xs"
          title="Suspended - Player is currently suspended and unavailable"
          aria-label="Suspended"
        >
          ✕
        </span>
      )
    } else if (status === "Injured") {
      return (
        <span
          className="inline-block w-4 h-4 bg-yellow-100 text-yellow-600 rounded-full text-center font-bold mr-1 cursor-help flex items-center justify-center text-xs"
          title="Injured - Player is currently injured and unavailable"
          aria-label="Injured"
        >
          !
        </span>
      )
    } else if (status === "Doubtful") {
      return (
        <span
          className="inline-block w-4 h-4 bg-orange-100 text-orange-600 rounded-full text-center font-bold mr-1 cursor-help flex items-center justify-center text-xs"
          title="Doubtful - Player's availability is uncertain"
          aria-label="Doubtful"
        >
          ?
        </span>
      )
    } else if (status === "Not Selected") {
      return (
        <span
          className="inline-block w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-center font-bold mr-1 cursor-help flex items-center justify-center text-xs"
          title="Not Selected - Player is not selected for this round"
          aria-label="Not Selected"
        >
          ○
        </span>
      )
    } else if (status === "Unavailable") {
      return (
        <span
          className="inline-block w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-center font-bold mr-1 cursor-help flex items-center justify-center text-xs"
          title="Unavailable - Player is unavailable for selection"
          aria-label="Unavailable"
        >
          ✕
        </span>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-3">
      <h2 className="text-sm font-semibold mb-2">Available Players</h2>

      <div className="mb-2">
        <input
          type="text"
          placeholder="Search players..."
          className="w-full p-1 text-xs border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-4 gap-1 mb-2">
        <div>
          <label htmlFor="position-filter" className="block text-xs font-medium text-gray-700 mb-0.5">
            Position
          </label>
          <select
            id="position-filter"
            className="w-full p-1 text-xs border border-gray-300 rounded-md"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="DEF">DEF</option>
            <option value="MID">MID</option>
            <option value="RUC">RUC</option>
            <option value="FWD">FWD</option>
          </select>
        </div>

        <div>
          <label htmlFor="team-filter" className="block text-xs font-medium text-gray-700 mb-0.5">
            Team
          </label>
          <select
            id="team-filter"
            className="w-full p-1 text-xs border border-gray-300 rounded-md"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-0.5">
            Status
          </label>
          <select
            id="status-filter"
            className="w-full p-1 text-xs border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Selected In 22">Selected In 22</option>
            <option value="VFL Listed">VFL Listed</option>
            <option value="Injured">Injured</option>
            <option value="Suspended">Suspended</option>
            <option value="Doubtful">Doubtful</option>
            <option value="Not Selected">Not Selected</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort-by" className="block text-xs font-medium text-gray-700 mb-0.5">
            Sort By
          </label>
          <div className="flex">
            <select
              id="sort-by"
              className="w-full p-1 text-xs border border-gray-300 rounded-l-md"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="position">Pos</option>
              <option value="team">Team</option>
              <option value="price">Price</option>
              <option value="averageScore">Avg</option>
            </select>
            <button
              className="px-1 py-1 text-xs border border-l-0 border-gray-300 rounded-r-md bg-gray-50"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-350px)]">
        <ul className="divide-y divide-gray-200">
          {sortedPlayers.map((player) => (
            <li key={player.registryId} className="py-2 flex items-center justify-between">
              <div className="flex items-center flex-grow mr-2">
                <div className="h-8 w-8 mr-2 flex-shrink-0">
                  <img
                    src={getTeamLogoPath(player.team) || "/placeholder.svg"}
                    alt={player.team}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                    onError={handleImageError}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                    {player.name}
                    {player.status && player.status !== "Active" && (
                      <span className="ml-1">{renderStatusIcon(player.status)}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {player.position} | ${player.price.toLocaleString()} | {player.team}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    Registry ID: {player.registryId}
                    {player.csvId && player.csvId !== player.registryId && ` | CSV: ${player.csvId}`}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1 flex-shrink-0">
                <button
                  onClick={() => onAddPlayer(player)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add
                </button>
                <button
                  onClick={() => handleInfoClick(player)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Info
                </button>
              </div>
            </li>
          ))}
          {sortedPlayers.length === 0 && (
            <li className="py-3 text-center text-xs text-gray-500">No players found matching your filters.</li>
          )}
        </ul>
      </div>

      {/* Player Info Modal */}
      {selectedPlayer && <PlayerInfoModal player={selectedPlayer} onClose={handleCloseModal} isInTeam={false} />}
    </div>
  )
}
