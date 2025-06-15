"use client"

import type React from "react"
import { useState } from "react"
import type { Player } from "@/lib/teamData"
import { getTeamLogoPath } from "@/lib/teamLogos"
import PlayerInfoModal from "@/components/player-info/PlayerInfoModal"

interface MyTeamProps {
  players: Player[]
  onRemovePlayer: (playerId: string) => void
  captain: string | null
  onSetCaptain: (playerId: string) => void
}

export default function MyTeam({ players, onRemovePlayer, captain, onSetCaptain }: MyTeamProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  // Group players by position
  const defPlayers = players.filter((p) => p.position === "DEF")
  const midPlayers = players.filter((p) => p.position === "MID")
  const rucPlayers = players.filter((p) => p.position === "RUC")
  const fwdPlayers = players.filter((p) => p.position === "FWD")

  // Calculate total salary
  const totalSalary = players.reduce((sum, player) => sum + player.price, 0)

  const handleInfoClick = (player: Player) => {
    setSelectedPlayer(player)
  }

  const handleCloseModal = () => {
    setSelectedPlayer(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Team</h2>
        <div className="text-sm text-gray-600">
          Total Salary: <span className="font-semibold">${totalSalary.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Defenders ({defPlayers.length}/6)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {defPlayers.map((player) => (
              <PlayerCard
                key={player.registryId}
                player={player}
                onRemove={onRemovePlayer}
                isCaptain={captain === player.registryId}
                onSetCaptain={onSetCaptain}
                onInfoClick={handleInfoClick}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Midfielders ({midPlayers.length}/5)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {midPlayers.map((player) => (
              <PlayerCard
                key={player.registryId}
                player={player}
                onRemove={onRemovePlayer}
                isCaptain={captain === player.registryId}
                onSetCaptain={onSetCaptain}
                onInfoClick={handleInfoClick}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Rucks ({rucPlayers.length}/1)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {rucPlayers.map((player) => (
              <PlayerCard
                key={player.registryId}
                player={player}
                onRemove={onRemovePlayer}
                isCaptain={captain === player.registryId}
                onSetCaptain={onSetCaptain}
                onInfoClick={handleInfoClick}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Forwards ({fwdPlayers.length}/6)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {fwdPlayers.map((player) => (
              <PlayerCard
                key={player.registryId}
                player={player}
                onRemove={onRemovePlayer}
                isCaptain={captain === player.registryId}
                onSetCaptain={onSetCaptain}
                onInfoClick={handleInfoClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Player Info Modal */}
      {selectedPlayer && (
        <PlayerInfoModal
          player={selectedPlayer}
          onClose={handleCloseModal}
          onRemove={onRemovePlayer}
          onMakeCaptain={onSetCaptain}
          isInTeam={true}
        />
      )}
    </div>
  )
}

interface PlayerCardProps {
  player: Player
  onRemove: (playerId: string) => void
  isCaptain: boolean
  onSetCaptain: (playerId: string) => void
  onInfoClick: (player: Player) => void
}

// Update the PlayerCard component to use registry ID
function PlayerCard({ player, onRemove, isCaptain, onSetCaptain, onInfoClick }: PlayerCardProps) {
  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  return (
    <div className={`border rounded-md p-2 ${isCaptain ? "border-yellow-400 bg-yellow-50" : "border-gray-200"}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
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
          <div>
            <div className="font-medium text-gray-900 flex items-center">
              {player.name}
              {isCaptain && (
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  C
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {player.team} | {player.position} | ${player.price.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onInfoClick(player)}
            className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
            title="Player Info"
          >
            i
          </button>
          <button
            onClick={() => onSetCaptain(player.registryId)}
            className={`text-xs px-1.5 py-0.5 rounded ${
              isCaptain
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            title={isCaptain ? "Remove as Captain" : "Make Captain"}
          >
            C
          </button>
          <button
            onClick={() => onRemove(player.registryId)}
            className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-800 hover:bg-red-200"
            title="Remove Player"
          >
            X
          </button>
        </div>
      </div>
    </div>
  )
}
