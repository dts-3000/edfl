"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import TopMenu from "@/components/layout/TopMenu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, LogOut, Palette } from "lucide-react"
import { loadTeamData, type TeamData } from "@/lib/teamData"

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [teamData, setTeamData] = useState<TeamData | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)

      // Load team data
      if (user) {
        try {
          const data = await loadTeamData()
          setTeamData(data)
        } catch (error) {
          console.error("Error loading team data:", error)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopMenu />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopMenu />
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Account Access</CardTitle>
              <CardDescription>Please sign in to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/login")} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopMenu />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-green-600">Active</p>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Logo Creator Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Team Customization
                </CardTitle>
                <CardDescription>Create custom team logos and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => router.push("/logo-creator")} className="w-full">
                  Create Team Logo
                </Button>

                {teamData?.logoUrl && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 mb-2">Current Team Logo</p>
                    <div className="flex justify-center">
                      <img
                        src={teamData.logoUrl || "/placeholder.svg"}
                        alt={`${teamData.teamName} logo`}
                        className="w-40 h-40 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{teamData.teamName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
