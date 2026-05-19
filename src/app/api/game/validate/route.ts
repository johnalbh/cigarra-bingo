import { NextResponse } from "next/server";
import { validateCarton } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cartonId = String(body.cartonId ?? "");
    if (!cartonId) {
      return NextResponse.json({ error: "cartonId requerido" }, { status: 400 });
    }
    const result = validateCarton(cartonId);
    if (!result.ok) {
      return NextResponse.json({ error: "Cartón no encontrado" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
