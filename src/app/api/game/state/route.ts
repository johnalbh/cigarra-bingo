import { NextResponse } from "next/server";
import { getGameState, getStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ game: getGameState(), stats: getStats() });
}
