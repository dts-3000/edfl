import AdminLayout from "@/components/admin/AdminLayout"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading registry linking tool...</span>
      </div>
    </AdminLayout>
  )
}
