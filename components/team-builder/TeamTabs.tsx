"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface TeamTabsProps {
  activeTab?: string
}

export default function TeamTabs({ activeTab }: TeamTabsProps) {
  const pathname = usePathname()

  const tabs = [
    { name: "Dashboard", href: "/dashboard", id: "dashboard" },
    { name: "Team Builder", href: "/team-builder", id: "team-builder" },
    { name: "Player Stats", href: "/player-stats", id: "player-stats" },
    { name: "Advanced Stats", href: "/advanced-stats", id: "advanced-stats" },
    { name: "Projections", href: "/projections", id: "projections" },
    { name: "Club Analysis", href: "/team-trends", id: "club-analysis" },
    { name: "VFL Stats", href: "/vfl-stats", id: "vfl-stats" },
    { name: "Game Stats", href: "/game-stats", id: "game-stats" },
  ]

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
