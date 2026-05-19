import { NextResponse } from "next/server";
import { getCarton } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const carton = getCarton(id);
  if (!carton) {
    return NextResponse.json({ error: "Cartón no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ carton });
}
