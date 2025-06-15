"use client"

import Navbar from "@/components/layout/Navbar"
import LogoBuilder from "@/components/team-builder/LogoBuilder"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LogoBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Team Logo Builder</h1>
          <Link href="/account">
            <Button variant="outline">Back to Account</Button>
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-6">
            Create a custom logo for your fantasy team. Use the tools below to add shapes, text, and colors to design
            your perfect team emblem.
          </p>
          <LogoBuilder />
        </div>
      </div>
    </div>
  )
}
