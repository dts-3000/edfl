import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

async function getLeagueHistory() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: leagueHistory } = await supabase
    .from("leagues")
    .select("*")
    .eq("owner", session.user.id)
    .order("created_at", { ascending: false })

  if (!leagueHistory) {
    notFound()
  }

  return leagueHistory
}

async function getClubsWithStats(leagueId: string) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select(
      `
      *,
      club_stats (
        wins,
        losses,
        draws,
        points
      )
    `,
    )
    .eq("league_id", leagueId)

  if (error) {
    console.error("Error fetching clubs with stats:", error)
    return []
  }

  return clubs
}

export default async function LeagueHistoryPage() {
  const leagueHistory = await getLeagueHistory()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">League History</h1>
      {leagueHistory.map((league) => (
        <div key={league.id} className="bg-white rounded-lg shadow-md p-5 mb-5">
          <h2 className="text-2xl font-semibold mb-3">{league.name}</h2>
          <p className="text-gray-600 mb-3">Created at: {league.created_at}</p>
          <Badge className="mb-3">{league.status}</Badge>
          <div>
            <h3 className="text-xl font-semibold mb-2">Clubs:</h3>
            {/* Fetch and display clubs for the league */}
            <ClubList leagueId={league.id} />
          </div>
        </div>
      ))}
    </div>
  )
}

interface ClubListProps {
  leagueId: string
}

async function ClubList({ leagueId }: ClubListProps) {
  const clubsWithStats = await getClubsWithStats(leagueId)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clubsWithStats.map((club: any) => (
        <div key={club.id} className="bg-gray-100 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-semibold">{club.name}</h4>
            <p className="text-sm text-gray-500">
              Wins: {club.club_stats[0]?.wins || 0}, Losses: {club.club_stats[0]?.losses || 0}, Draws:{" "}
              {club.club_stats[0]?.draws || 0}, Points: {club.club_stats[0]?.points || 0}
            </p>
          </div>
          <div className="mt-2">
            <Link href={`/clubs/${club.slug}`}>
              <Button variant="outline" size="sm">
                View Club History
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
