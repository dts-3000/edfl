import TeamOval from "@/components/team/TeamOval"
import type { Player } from "@/lib/teamData"

interface TeamVisualizationProps {
  selectedPlayers: Player[]
  captain: string | null
  onSetCaptain: (playerId: string) => void
  onRemovePlayer: (playerId: string) => void
}

export default function TeamVisualization({
  selectedPlayers,
  captain,
  onSetCaptain,
  onRemovePlayer,
}: TeamVisualizationProps) {
  return (
    <div>
      <TeamOval
        selectedPlayers={selectedPlayers}
        captain={captain}
        onSetCaptain={onSetCaptain}
        onRemovePlayer={onRemovePlayer}
      />
    </div>
  )
}
