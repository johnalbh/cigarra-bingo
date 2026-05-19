import { NextResponse } from "next/server";
import { createPurchase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ownerName = String(body.ownerName ?? "").trim();
    const ownerEmail = String(body.ownerEmail ?? "").trim().toLowerCase();
    const ownerPhone = body.ownerPhone ? String(body.ownerPhone).trim() : undefined;
    const quantity = Number(body.quantity ?? 1);

    if (!ownerName || ownerName.length < 2) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return NextResponse.json(
        { error: "Cantidad debe estar entre 1 y 20" },
        { status: 400 }
      );
    }

    const { purchase, cartones } = createPurchase({
      ownerName,
      ownerEmail,
      ownerPhone,
      quantity,
    });

    return NextResponse.json({ purchase, cartones }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Error procesando la compra" },
      { status: 500 }
    );
  }
}
