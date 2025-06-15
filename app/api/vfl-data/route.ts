import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get("url")

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    console.log("Fetching VFL data from server:", fileUrl)

    // Fetch the CSV file from Firebase Storage
    const response = await fetch(fileUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    return new NextResponse(csvText, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error: any) {
    console.error("Error in VFL data API:", error)
    return NextResponse.json({ error: `Failed to fetch VFL data: ${error.message}` }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
