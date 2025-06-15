"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Player } from "@/lib/teamData"
import { getTeamLogoPath } from "@/lib/teamLogos"
import PlayerInfoModal from "@/components/player-info/PlayerInfoModal"

interface TeamOvalProps {
  selectedPlayers: Player[]
  captain: string | null
  onSetCaptain: (playerId: string) => void
  onRemovePlayer: (playerId: string) => void
}

export default function TeamOval({ selectedPlayers, captain, onSetCaptain, onRemovePlayer }: TeamOvalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [ovalImageError, setOvalImageError] = useState(false)
  const [ovalImageLoaded, setOvalImageLoaded] = useState(false)

  // Group players by position
  const defPlayers = selectedPlayers.filter((p) => p.position === "DEF")
  const midPlayers = selectedPlayers.filter((p) => p.position === "MID")
  const rucPlayers = selectedPlayers.filter((p) => p.position === "RUC")
  const fwdPlayers = selectedPlayers.filter((p) => p.position === "FWD")

  // Force reload of oval image
  useEffect(() => {
    // Preload the oval image with multiple fallback options
    const tryLoadImage = (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = src
      })
    }

    const loadOvalImage = async () => {
      // Try primary oval image first
      const primaryLoaded = await tryLoadImage("/images/oval.png")
      if (primaryLoaded) {
        setOvalImageLoaded(true)
        setOvalImageError(false)
        return
      }

      // Try fallback oval image
      const fallbackLoaded = await tryLoadImage("/images/oval-fallback.png")
      if (fallbackLoaded) {
        setOvalImageLoaded(true)
        setOvalImageError(false)
        return
      }

      // If both fail, show error state
      console.error("Failed to load both oval images")
      setOvalImageError(true)
    }

    loadOvalImage()
  }, [])

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player)
  }

  const handleCloseModal = () => {
    setSelectedPlayer(null)
  }

  const handleOvalImageError = () => {
    console.error("Failed to load oval image")
    setOvalImageError(true)
  }

  return (
    <div className="relative">
      <div className="relative w-full h-[500px] bg-contain bg-center bg-no-repeat">
        {!ovalImageError ? (
          <img
            src="/images/oval.png"
            alt="Football Oval"
            className="absolute inset-0 w-full h-full object-contain"
            onError={() => {
              console.error("Failed to load oval.png, trying fallback")
              setOvalImageError(true)
            }}
            onLoad={() => {
              console.log("Oval image loaded successfully")
              setOvalImageLoaded(true)
            }}
          />
        ) : (
          // Enhanced fallback oval design
          <div className="absolute inset-0 w-full h-full">
            <svg viewBox="0 0 800 500" className="w-full h-full">
              <ellipse cx="400" cy="250" rx="380" ry="230" fill="#22c55e" stroke="#16a34a" strokeWidth="4" />
              <ellipse cx="400" cy="250" rx="300" ry="180" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
              <circle cx="400" cy="250" r="50" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
              <text x="400" y="260" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" opacity="0.7">
                EDFL OVAL
              </text>
            </svg>
          </div>
        )}

        {/* Back Defenders (4) */}
        <div className="absolute top-[5%] left-0 right-0 flex justify-center">
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => {
              const player = defPlayers[index]
              return (
                <PlayerPosition
                  key={`def-back-${index}`}
                  player={player}
                  position="DEF"
                  isCaptain={player ? captain === player.id : false}
                  onClick={player ? () => handlePlayerClick(player) : undefined}
                />
              )
            })}
          </div>
        </div>

        {/* Front Defenders (2) */}
        <div className="absolute top-[22%] left-0 right-0 flex justify-center">
          <div className="grid grid-cols-2 gap-16">
            {Array.from({ length: 2 }).map((_, index) => {
              const player = defPlayers[index + 4]
              return (
                <PlayerPosition
                  key={`def-front-${index}`}
                  player={player}
                  position="DEF"
                  isCaptain={player ? captain === player.id : false}
                  onClick={player ? () => handlePlayerClick(player) : undefined}
                />
              )
            })}
          </div>
        </div>

        {/* Midfielders */}
        <div className="absolute top-[39%] left-0 right-0 flex justify-center">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => {
              const player = midPlayers[index]
              return (
                <PlayerPosition
                  key={`mid-${index}`}
                  player={player}
                  position="MID"
                  isCaptain={player ? captain === player.id : false}
                  onClick={player ? () => handlePlayerClick(player) : undefined}
                />
              )
            })}
          </div>
        </div>

        {/* Ruck */}
        <div className="absolute top-[55%] left-0 right-0 flex justify-center">
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 1 }).map((_, index) => {
              const player = rucPlayers[index]
              return (
                <PlayerPosition
                  key={`ruc-${index}`}
                  player={player}
                  position="RUC"
                  isCaptain={player ? captain === player.id : false}
                  onClick={player ? () => handlePlayerClick(player) : undefined}
                />
              )
            })}
          </div>
        </div>

        {/* Upper Forwards (2) - Moved to 22% from bottom */}
        <div className="absolute bottom-[22%] left-0 right-0 flex justify-center">
          <div className="grid grid-cols-2 gap-16">
            {Array.from({ length: 2 }).map((_, index) => {
              const player = fwdPlayers[index]
              return (
                <PlayerPosition
                  key={`fwd-upper-${index}`}
                  player={player}
                  position="FWD"
                  isCaptain={player ? captain === player.id : false}
                  onClick={player ? () => handlePlayerClick(player) : undefined}
                />
              )
            })}
          </div>
        </div>

        {/* Bottom Forwards (4) */}
        <div className="absolute bottom-[8%] left-0 right-0 flex justify-center">
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => {
              const player = fwdPlayers[index + 2]
              return (
                <PlayerPosition
                  key={`fwd-bottom-${index}`}
                  player={player}
                  position="FWD"
                  isCaptain={player ? captain === player.id : false}
                  onClick={player ? () => handlePlayerClick(player) : undefined}
                />
              )
            })}
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

interface PlayerPositionProps {
  player?: Player
  position: string
  isCaptain: boolean
  onClick?: () => void
}

function PlayerPosition({ player, position, isCaptain, onClick }: PlayerPositionProps) {
  const [logoError, setLogoError] = useState(false)

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`Failed to load team logo for ${player?.team}`)
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
    setLogoError(true)
  }

  // Preload team logo if player exists
  useEffect(() => {
    if (player) {
      const img = new Image()
      img.onload = () => setLogoError(false)
      img.onerror = () => setLogoError(true)
      img.src = getTeamLogoPath(player.team)
    }
  }, [player])

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
          player
            ? isCaptain
              ? "bg-white border-2 border-yellow-400"
              : "bg-white border border-gray-300"
            : "bg-gray-200 border border-gray-300"
        }`}
        onClick={onClick}
      >
        {player ? (
          <>
            <img
              src={logoError ? "/images/teams/placeholder.png" : getTeamLogoPath(player.team)}
              alt={player.team}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              onError={handleImageError}
            />
            {isCaptain && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                C
              </div>
            )}
          </>
        ) : (
          <span className="text-gray-500 font-medium">{position.charAt(0)}</span>
        )}
      </div>
      {player && (
        <div className="mt-1 text-center">
          <span className="text-xs font-medium bg-white px-1 py-0.5 rounded shadow-sm">{player.name}</span>
        </div>
      )}
    </div>
  )
}
