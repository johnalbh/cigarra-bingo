import { NextResponse } from "next/server";
import { createAdminCartones, isAdmin, listAllCartones } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!isAdmin(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const cartones = listAllCartones()
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ cartones, count: cartones.length });
}

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!isAdmin(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const ownerName = String(body.ownerName ?? "").trim();
    const ownerEmail = body.ownerEmail
      ? String(body.ownerEmail).trim()
      : undefined;
    const quantity = Number(body.quantity ?? 1);

    if (!ownerName || ownerName.length < 2) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 50) {
      return NextResponse.json(
        { error: "Cantidad entre 1 y 50" },
        { status: 400 }
      );
    }
    const cartones = createAdminCartones({ ownerName, ownerEmail, quantity });
    return NextResponse.json({ cartones }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
