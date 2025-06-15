"use client"

import { useState, useEffect } from "react"
import { useTrade } from "@/contexts/TradeContext"
import { loadTeamData, type Player } from "@/lib/teamData"
import Navbar from "@/components/layout/Navbar"
import TeamTabs from "@/components/team-builder/TeamTabs"
import TradeSimulator from "@/components/trades/TradeSimulator"
import PendingTradesList from "@/components/trades/PendingTradesList"
import TradeHistory from "@/components/trades/TradeHistory"
import LockoutTimer from "@/components/trades/LockoutTimer"

export default function TradesClient() {
  const {
    leagueSettings,
    userTradeState,
    isLoading,
    error,
    isSimulating,
    getTradesRemaining,
    isPreSeason,
    isTradeAllowed,
  } = useTrade()

  const [myTeam, setMyTeam] = useState<Player[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoadingTeam(true)
        const teamData = await loadTeamData()
        setMyTeam(teamData.players || [])
      } catch (err) {
        console.error("Error loading team data:", err)
      } finally {
        setLoadingTeam(false)
      }
    }

    fetchTeamData()
  }, [])

  if (isLoading || loadingTeam) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Trade Center</h1>
          <TeamTabs activeTab="trades" />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trade Center</h1>
        <TeamTabs activeTab="trades" />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Trade Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${isTradeAllowed() ? "bg-green-100" : "bg-red-100"}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">
                {isPreSeason() ? "Pre-Season Mode: Unlimited Trades" : `Trades Remaining: ${getTradesRemaining()}`}
              </h2>
              <p className={isTradeAllowed() ? "text-green-700" : "text-red-700"}>
                {isTradeAllowed() ? "Trading is currently open" : "Trading is currently locked"}
              </p>
            </div>
            <LockoutTimer />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade Simulator */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Trade Simulator</h2>
              <TradeSimulator myTeam={myTeam} />
            </div>
          </div>

          {/* Pending Trades */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Pending Trades</h2>
              <PendingTradesList />
            </div>
          </div>

          {/* Trade History */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Trade History</h2>
              <TradeHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
