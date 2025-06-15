"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shell } from "@/components/shell"
import { useState, useEffect } from "react"

interface ClubRecord {
  id: string
  clubName: string
  presidentName: string
  email: string
  phone: string
}

const ClubRecordsPage = () => {
  const [clubRecords, setClubRecords] = useState<ClubRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Replace with your actual data fetching logic
    const fetchData = async () => {
      try {
        // Simulate fetching data from an API
        const mockData: ClubRecord[] = [
          {
            id: "1",
            clubName: "Coding Club",
            presidentName: "Alice Smith",
            email: "alice.smith@example.com",
            phone: "123-456-7890",
          },
          {
            id: "2",
            clubName: "Debate Society",
            presidentName: "Bob Johnson",
            email: "bob.johnson@example.com",
            phone: "987-654-3210",
          },
          {
            id: "3",
            clubName: "Photography Club",
            presidentName: "Charlie Brown",
            email: "charlie.brown@example.com",
            phone: "555-123-4567",
          },
        ]
        setClubRecords(mockData)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const filteredClubRecords = clubRecords.filter((record) =>
    record.clubName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle>Club Records</CardTitle>
          <CardDescription>Manage club information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="search">Search Club Name:</Label>
              <Input
                type="text"
                id="search"
                placeholder="Enter club name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Table>
              <TableCaption>A list of your recent clubs.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Club Name</TableHead>
                  <TableHead>President Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClubRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.id}</TableCell>
                    <TableCell>{record.clubName}</TableCell>
                    <TableCell>{record.presidentName}</TableCell>
                    <TableCell>{record.email}</TableCell>
                    <TableCell>{record.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Add New Club</Button>
        </CardFooter>
      </Card>
    </Shell>
  )
}

export default ClubRecordsPage
