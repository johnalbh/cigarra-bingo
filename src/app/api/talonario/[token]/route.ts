import { NextResponse } from "next/server";
import { getTalonarioByToken } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const view = getTalonarioByToken(token);
  if (!view) {
    return NextResponse.json(
      { error: "Talonario no encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json(view);
}
