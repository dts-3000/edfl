import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Basic health check
    const timestamp = new Date().toISOString()

    return NextResponse.json({
      status: "healthy",
      timestamp,
      message: "App is running normally",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
