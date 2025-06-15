"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  Trophy,
  Upload,
  Database,
  UserCheck,
  Calendar,
  TrendingUp,
  Menu,
  Shield,
  History,
  Building2,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Players",
    href: "/admin/players",
    icon: UserCheck,
    children: [
      { title: "All Players", href: "/admin/players" },
      { title: "Registry", href: "/admin/players/registry" },
      { title: "Migration", href: "/admin/players/migration" },
      { title: "Debug", href: "/admin/players/debug" },
      { title: "Edit Stats", href: "/admin/players/edit-stats" },
    ],
  },
  {
    title: "Statistics",
    href: "/admin/stats",
    icon: BarChart3,
    children: [
      { title: "Upload", href: "/admin/stats/upload" },
      { title: "Manage", href: "/admin/stats/manage" },
      { title: "History", href: "/admin/stats/history" },
    ],
  },
  {
    title: "VFL Stats",
    href: "/admin/vfl-stats",
    icon: TrendingUp,
  },
  {
    title: "Matches",
    href: "/admin/matches",
    icon: Calendar,
  },
  {
    title: "Live Scores",
    href: "/admin/live-scores",
    icon: Trophy,
  },
  {
    title: "Teams",
    href: "/admin/teams",
    icon: Shield,
  },
  {
    title: "Clubs",
    href: "/admin/clubs",
    icon: Building2,
    children: [
      { title: "All Clubs", href: "/admin/clubs" },
      { title: "Records", href: "/admin/clubs/records" },
      { title: "Articles", href: "/admin/clubs/articles" },
    ],
  },
  {
    title: "League History",
    href: "/admin/league-history",
    icon: History,
  },
  {
    title: "News",
    href: "/admin/news",
    icon: FileText,
  },
  {
    title: "Logo Assets",
    href: "/admin/logo-assets",
    icon: Upload,
  },
  {
    title: "Debug Tools",
    href: "/admin/debug",
    icon: Database,
    children: [
      { title: "Firebase Debug", href: "/admin/firebase-debug" },
      { title: "Player Data", href: "/admin/debug-player-data" },
      { title: "Match Debug", href: "/admin/debug-match" },
      { title: "Collections", href: "/admin/debug-collections" },
      { title: "Name Matching", href: "/admin/debug-name-matching" },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">EDFL Admin</h2>
          <div className="space-y-1">
            {sidebarNavItems.map((item) => (
              <div key={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
                {item.children && (
                  <div className="ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        variant={pathname === child.href ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href={child.href}>{child.title}</Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="grid lg:grid-cols-5">
      <Sidebar className="hidden lg:block" />
      <div className="col-span-3 lg:col-span-4 lg:border-l">
        <div className="h-full px-4 py-6 lg:px-8">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mb-4">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <ScrollArea className="h-full">
                  <Sidebar />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
