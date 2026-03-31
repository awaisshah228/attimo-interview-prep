import { NextRequest, NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";

  // Simulate network delay (200-400ms)
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));

  const results = searchSuggestions(q);
  return NextResponse.json(results);
}
