"use client"

import { useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search } from "lucide-react"

export default function DebugPlayerPage() {
  const [playerName, setPlayerName] = useState("Matthew Hanson")
  const [teamName, setTeamName] = useState("Airport West")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [similarNames, setSimilarNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")

  const searchPlayer = async () => {
    setLoading(true)
    setSearchResults([])
    setSimilarNames([])
    setDebugInfo("Searching for player...")

    try {
      // Exact match search
      const statsRef = collection(db, "playerStats")
      const exactQuery = query(statsRef, where("playerName", "==", playerName), where("team", "==", teamName))
      const exactSnapshot = await getDocs(exactQuery)

      setDebugInfo(`Exact match search: ${exactSnapshot.size} results`)

      if (!exactSnapshot.empty) {
        const results = exactSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setSearchResults(results)
      } else {
        // Search for similar names
        setDebugInfo("No exact matches found. Searching for similar names...")
        const allPlayersQuery = query(statsRef, where("team", "==", teamName))
        const allPlayersSnapshot = await getDocs(allPlayersQuery)

        const allNames = new Set<string>()
        allPlayersSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.playerName) {
            allNames.add(data.playerName)
          }
        })

        // Find similar names
        const nameArray = Array.from(allNames)
        const similar = nameArray.filter((name) => {
          // Check for partial matches
          const nameLower = name.toLowerCase()
          const searchLower = playerName.toLowerCase()

          // Check for first name / last name matches
          const nameParts = nameLower.split(" ")
          const searchParts = searchLower.split(" ")

          // Check for nickname variations (Matt vs Matthew)
          const commonNicknames: Record<string, string[]> = {
            matthew: ["matt"],
            michael: ["mike", "mick"],
            christopher: ["chris"],
            robert: ["rob", "bob"],
            william: ["will", "bill"],
            james: ["jim", "jimmy"],
            joseph: ["joe", "joey"],
            thomas: ["tom", "tommy"],
            daniel: ["dan", "danny"],
            anthony: ["tony"],
            richard: ["rick", "dick"],
            charles: ["charlie", "chuck"],
            nicholas: ["nick"],
            benjamin: ["ben"],
            samuel: ["sam"],
            alexander: ["alex"],
            patrick: ["pat"],
            edward: ["ed", "eddie"],
            jonathan: ["jon", "jonny"],
            david: ["dave"],
          }

          // Check if first name could be a nickname
          let nicknameMatch = false
          if (searchParts[0] && nameParts[0]) {
            // Check if search name is a nickname of the actual name
            for (const [fullName, nicknames] of Object.entries(commonNicknames)) {
              if (nameParts[0].toLowerCase() === fullName && nicknames.includes(searchParts[0].toLowerCase())) {
                nicknameMatch = true
                break
              }
              // Check if actual name is a nickname of the search name
              if (searchParts[0].toLowerCase() === fullName && nicknames.includes(nameParts[0].toLowerCase())) {
                nicknameMatch = true
                break
              }
            }
          }

          return (
            nameLower.includes(searchLower) ||
            searchLower.includes(nameLower) ||
            (nameParts.length > 1 && searchParts.length > 1 && nameParts[1] === searchParts[1]) || // Last name match
            nicknameMatch
          )
        })

        setSimilarNames(similar)
        setDebugInfo(`Found ${similar.length} similar names for ${playerName} at ${teamName}`)

        // If we found similar names, search for the first one
        if (similar.length > 0) {
          const firstSimilarQuery = query(
            statsRef,
            where("playerName", "==", similar[0]),
            where("team", "==", teamName),
          )
          const firstSimilarSnapshot = await getDocs(firstSimilarQuery)

          if (!firstSimilarSnapshot.empty) {
            const results = firstSimilarSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            setSearchResults(results)
            setDebugInfo(`Found ${results.length} records for similar name: ${similar[0]}`)
          }
        }
      }
    } catch (error) {
      console.error("Error searching for player:", error)
      setDebugInfo(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Player Name Debug Tool</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search for Player
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Player Name</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Team</label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter team name" />
            </div>
          </div>

          <Button onClick={searchPlayer} disabled={loading}>
            {loading ? "Searching..." : "Search Player"}
          </Button>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {debugInfo && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">{debugInfo}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Names */}
      {similarNames.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Similar Names Found</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {similarNames.map((name, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-600">•</span>
                  <span>{name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-7 px-2"
                    onClick={() => {
                      setPlayerName(name)
                      searchPlayer()
                    }}
                  >
                    Use This Name
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Player Records Found ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Player Name</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-left p-2">Season</th>
                    <th className="text-left p-2">Round</th>
                    <th className="text-right p-2">Quarter</th>
                    <th className="text-right p-2">Fantasy Points</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{result.playerName}</td>
                      <td className="p-2">{result.team}</td>
                      <td className="p-2">{result.season}</td>
                      <td className="p-2">{result.round}</td>
                      <td className="p-2 text-right">{result.quarter}</td>
                      <td className="p-2 text-right">{result.fantasyPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
