import { NextResponse } from "next/server";
import { isAdmin, setGameStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!isAdmin(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { action } = (await req.json()) as {
      action: "start" | "pause" | "finish";
    };
    const map = { start: "live", pause: "paused", finish: "finished" } as const;
    const next = map[action];
    if (!next) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }
    const game = setGameStatus(next);
    return NextResponse.json({ game });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
