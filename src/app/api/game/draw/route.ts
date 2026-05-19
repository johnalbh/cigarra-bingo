import { NextResponse } from "next/server";
import { drawNext, isAdmin } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!isAdmin(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { number, state } = drawNext();
  return NextResponse.json({ number, game: state });
}
