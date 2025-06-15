import type React from "react"

interface TeamHeaderProps {
  teamData: {
    name: string
    logoUrl?: string
  }
}

const TeamHeader: React.FC<TeamHeaderProps> = ({ teamData }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-md">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold">{teamData.name}</h2>
        {teamData.logoUrl && (
          <div className="w-12 h-12 border border-gray-200 rounded-lg overflow-hidden bg-white ml-4">
            <img
              src={teamData.logoUrl || "/placeholder.svg"}
              alt="Team Logo"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamHeader
