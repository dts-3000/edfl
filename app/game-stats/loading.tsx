import TeamTabs from "@/components/team-builder/TeamTabs"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Game Stats</h1>
      <TeamTabs activeTab="game-stats" />
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </div>
  )
}
