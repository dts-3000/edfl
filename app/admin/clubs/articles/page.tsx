import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PlusIcon } from "@radix-ui/react-icons"
import Link from "next/link"

export default function ArticlesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Link href="/admin/clubs/articles/create">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Article
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input type="text" placeholder="Search articles..." />
      </div>

      <Table>
        <TableCaption>A list of your recent articles.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">1</TableCell>
            <TableCell>Sample Article Title</TableCell>
            <TableCell>John Doe</TableCell>
            <TableCell>2023-10-27</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">2</TableCell>
            <TableCell>Another Article Title</TableCell>
            <TableCell>Jane Smith</TableCell>
            <TableCell>2023-10-26</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
