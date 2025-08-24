import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Video from "@/models/Video";

export async function GET() {
  try {
    await connectToDatabase();
    
    const videos = await Video.find({})
      .sort({ createdAt: -1 }) // Most recent first
      .limit(50); // Limit to 50 videos for performance
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
} 