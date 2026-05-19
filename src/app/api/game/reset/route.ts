import { NextResponse } from "next/server";
import { isAdmin, resetGame } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!isAdmin(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const game = resetGame();
  return NextResponse.json({ game });
}
