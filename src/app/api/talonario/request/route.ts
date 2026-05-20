import { NextResponse } from "next/server";
import { ensureTokenForEmail, getTalonarioByToken } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Request a magic link by email.
 *
 * In demo mode, returns the link directly so the user can see it on screen.
 * In production with email infrastructure, set EMAIL_PROVIDER and switch to
 * server-side send + a generic "if your email exists you will receive it"
 * response (to avoid email enumeration).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    const token = ensureTokenForEmail(email);
    const view = getTalonarioByToken(token);
    const hasPurchases = (view?.totalCartones ?? 0) > 0;
    return NextResponse.json({
      ok: true,
      token,
      hasPurchases,
      // Demo only — remove in production
      link: `/talonario/${token}`,
    });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
