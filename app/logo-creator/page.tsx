"use client"

import { Suspense } from "react"
import TopMenu from "@/components/layout/TopMenu"
import LogoCreator from "@/components/logo-creator"

function LogoCreatorContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopMenu />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Logo Creator</h1>
          <p className="mt-2 text-gray-600">Design your custom team logo</p>
        </div>
        <LogoCreator />
      </div>
    </div>
  )
}

export default function LogoCreatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <TopMenu />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }
    >
      <LogoCreatorContent />
    </Suspense>
  )
}
