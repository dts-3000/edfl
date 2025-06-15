"use client"
import type { Player } from "@/lib/teamData"

interface PlayerStatsFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  positionFilter: string
  setPositionFilter: (position: string) => void
  teamFilter: string
  setTeamFilter: (team: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  priceRange: number[]
  setPriceRange: (range: number[]) => void
  avgScoreRange: number[]
  setAvgScoreRange: (range: number[]) => void
  resetFilters: () => void
  players: Player[]
}

export default function PlayerStatsFilters({
  searchTerm,
  setSearchTerm,
  positionFilter,
  setPositionFilter,
  teamFilter,
  setTeamFilter,
  statusFilter,
  setStatusFilter,
  priceRange,
  setPriceRange,
  avgScoreRange,
  setAvgScoreRange,
  resetFilters,
  players,
}: PlayerStatsFiltersProps) {
  // Get unique teams from players
  const teams = Array.from(new Set(players.map((player) => player.team))).sort()

  // Get unique statuses from players
  const statuses = Array.from(new Set(players.map((player) => player.status))).sort()

  // Get min and max price
  const minPrice = Math.min(...players.map((player) => player.price))
  const maxPrice = Math.max(...players.map((player) => player.price))

  // Get min and max avg score
  const minAvgScore = Math.min(...players.map((player) => player.averageScore || 0))
  const maxAvgScore = Math.max(...players.map((player) => player.averageScore || 0))

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Player Filters</h2>
        <button onClick={resetFilters} className="text-blue-500 text-sm hover:text-blue-700 flex items-center">
          <span className="mr-1">×</span> Reset all filters
        </button>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search players or teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Position Filter */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              id="position"
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option>All Positions</option>
              <option>DEF</option>
              <option>MID</option>
              <option>RUC</option>
              <option>FWD</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              id="team"
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option>All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="price-range" className="block text-sm font-medium text-gray-700">
                Max Price: ${priceRange[1].toLocaleString()}
              </label>
              <span className="text-xs text-gray-500">
                ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              id="price-range"
              min={minPrice}
              max={maxPrice}
              step={250}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Avg Score Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="avg-score-range" className="block text-sm font-medium text-gray-700">
                Max Avg Score: {avgScoreRange[1]}
              </label>
              <span className="text-xs text-gray-500">
                {avgScoreRange[0]} - {avgScoreRange[1]}
              </span>
            </div>
            <input
              type="range"
              id="avg-score-range"
              min={minAvgScore}
              max={maxAvgScore}
              step={5}
              value={avgScoreRange[1]}
              onChange={(e) => setAvgScoreRange([avgScoreRange[0], Number.parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
