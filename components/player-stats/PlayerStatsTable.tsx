"use client"

import type React from "react"

import { useState } from "react"
import type { Player } from "@/lib/teamData"
import { getTeamLogoPath } from "@/lib/teamLogos"

interface PlayerStatsTableProps {
  players: Player[]
}

export default function PlayerStatsTable({ players }: PlayerStatsTableProps) {
  const [sortColumn, setSortColumn] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedPlayers = [...players].sort((a, b) => {
    let aValue: any = a[sortColumn as keyof Player]
    let bValue: any = b[sortColumn as keyof Player]

    // Handle special cases
    if (sortColumn === "name") {
      aValue = a.name.toLowerCase()
      bValue = b.name.toLowerCase()
    } else if (sortColumn === "averageScore" || sortColumn === "breakeven") {
      aValue = a[sortColumn as keyof Player] || 0
      bValue = b[sortColumn as keyof Player] || 0
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return null

    return <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
  }

  const renderStatusIcon = (status: string) => {
    if (status === "Selected in 22") {
      return <span className="text-green-500 font-bold">✓</span>
    } else if (status === "VFL Listed") {
      return <span className="text-blue-500 font-bold">V</span>
    } else if (status === "Suspended") {
      return <span className="text-red-500 font-bold">✕</span>
    } else if (status === "Injured") {
      return <span className="text-yellow-500 font-bold">!</span>
    }
    return null
  }

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">Player Name {renderSortIcon("name")}</div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Position
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("price")}
            >
              <div className="flex items-center">Price {renderSortIcon("price")}</div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("averageScore")}
            >
              <div className="flex items-center">Average Score {renderSortIcon("averageScore")}</div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("breakeven")}
            >
              <div className="flex items-center">Breakeven {renderSortIcon("breakeven")}</div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{player.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 mr-2">
                    <img
                      src={getTeamLogoPath(player.team) || "/placeholder.svg"}
                      alt={player.team}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="text-sm text-gray-900">{player.team}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{player.position}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">${player.price.toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{player.averageScore || 0}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{player.breakeven || player.averageScore || 0}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  {renderStatusIcon(player.status)}
                  <span className="ml-1">{player.status}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
