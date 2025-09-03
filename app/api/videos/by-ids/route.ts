import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Video from "@/models/Video";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam) return NextResponse.json([], { status: 200 });
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const videos = await Video.find({ _id: { $in: ids } }).lean();
    // preserve input order
    const order = new Map(ids.map((id, idx) => [id, idx] as const));
    videos.sort((a: any, b: any) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));
    return NextResponse.json(videos, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

