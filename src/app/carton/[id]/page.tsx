"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CartonGrid } from "@/components/CartonGrid";
import { BingoBall } from "@/components/BingoBall";
import { evaluateCarton } from "@/lib/bingo";
import type { Carton, GameState, WinPattern } from "@/types/bingo";

type Status =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "ready"; carton: Carton };

const PATTERN_LABEL: Record<WinPattern, string> = {
  line: "Línea",
  diagonal: "Diagonal",
  corners: "Cuatro esquinas",
  blackout: "Bingo completo",
};

export default function CartonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [game, setGame] = useState<GameState | null>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    won: boolean;
    pattern: WinPattern | null;
    alreadyRegistered?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/cartones/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.carton) setStatus({ kind: "not_found" });
        else setStatus({ kind: "ready", carton: d.carton });
      });
  }, [id]);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/game/state", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (alive) setGame(data.game);
        }
      } catch {}
    }
    poll();
    const t = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (status.kind === "loading") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-slate-500">
        Cargando cartón…
      </div>
    );
  }
  if (status.kind === "not_found") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold text-primary-900">
          Cartón no encontrado
        </h1>
        <p className="text-slate-600 mt-2">
          Es posible que la partida haya sido reiniciada o el enlace sea
          incorrecto.
        </p>
        <Link
          href="/comprar"
          className="inline-block mt-5 px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold"
        >
          Comprar un cartón
        </Link>
      </div>
    );
  }

  const { carton } = status;
  const drawn = game?.drawn ?? [];
  const lastCalled = drawn[drawn.length - 1];
  const local = evaluateCarton(carton, drawn);

  async function callBingo() {
    setValidating(true);
    setValidation(null);
    try {
      const res = await fetch("/api/game/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartonId: id }),
      });
      const data = await res.json();
      setValidation(data);
    } finally {
      setValidating(false);
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Cartón
              </div>
              <div className="text-3xl font-extrabold text-primary-900 font-mono">
                #{carton.code}
              </div>
              <div className="text-sm text-slate-600">
                {carton.ownerName} · {carton.ownerEmail}
              </div>
            </div>
            <Link
              href="/jugar"
              className="px-4 py-2 rounded-lg bg-primary-50 text-primary-700 font-semibold text-sm hover:bg-primary-100"
            >
              Vista en vivo →
            </Link>
          </div>

          <CartonGrid
            carton={carton}
            drawn={drawn}
            highlight={lastCalled ?? null}
            size="lg"
          />

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={callBingo}
              disabled={validating}
              className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold shadow-lg shadow-accent-500/30"
            >
              {validating ? "Verificando…" : "¡BINGO! Validar mi cartón"}
            </button>
            <span className="text-xs text-slate-500">
              {local.won
                ? `Local: ${PATTERN_LABEL[local.pattern!]} ✓`
                : "Aún no hay patrón ganador en este cartón."}
            </span>
          </div>

          {validation && (
            <div
              className={`mt-4 rounded-xl p-4 border ${
                validation.won
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {validation.won ? (
                <>
                  <div className="font-bold text-lg">
                    ¡Felicidades! 🎉 Patrón: {PATTERN_LABEL[validation.pattern!]}
                  </div>
                  <p className="text-sm mt-1">
                    {validation.alreadyRegistered
                      ? "Tu premio ya estaba registrado anteriormente."
                      : "Tu premio quedó registrado. Acércate al organizador para reclamarlo."}
                  </p>
                </>
              ) : (
                <>
                  <div className="font-bold">Aún no es bingo.</div>
                  <p className="text-sm mt-1">
                    Sigue marcando, faltan más números por cantar.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Side: live status */}
        <aside className="space-y-4">
          <div className="bg-primary-900 text-white rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-primary-200">
              Último número
            </div>
            <div className="mt-3 flex justify-center">
              {lastCalled ? (
                <BingoBall n={lastCalled} size={120} gold />
              ) : (
                <div className="text-primary-200 text-sm">
                  Esperando inicio…
                </div>
              )}
            </div>
            <div className="mt-4 text-center text-xs text-primary-200">
              {drawn.length} de 75 números cantados
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
              Cantados
            </div>
            <div className="grid grid-cols-8 gap-1 max-h-72 overflow-auto">
              {Array.from({ length: 75 }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className={`text-[10px] font-mono text-center rounded py-1 ${
                    drawn.includes(n)
                      ? n === lastCalled
                        ? "bg-accent-500 text-white animate-pop"
                        : "bg-primary-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
