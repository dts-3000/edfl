import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/dashboard")

  // This will never be rendered, but we need to return something
  return null
}
