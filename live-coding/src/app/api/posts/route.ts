import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/lib/data";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page")) || 1;
  const limit = Number(request.nextUrl.searchParams.get("limit")) || 10;

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 300));

  const posts = getPosts(page, limit);
  return NextResponse.json(posts);
}
