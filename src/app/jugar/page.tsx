"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BingoBall } from "@/components/BingoBall";
import type { GameState } from "@/types/bingo";

export default function JugarPage() {
  const [game, setGame] = useState<GameState | null>(null);

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
    const t = setInterval(poll, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const drawn = game?.drawn ?? [];
  const lastCalled = drawn[drawn.length - 1];
  const status = game?.status ?? "idle";
  const winners = game?.winners ?? [];

  return (
    <section className="bg-mesh text-white min-h-[calc(100vh-64px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ring-1 ${
                status === "live"
                  ? "bg-green-500/20 text-green-200 ring-green-300/30"
                  : status === "finished"
                    ? "bg-slate-500/30 text-slate-200 ring-white/20"
                    : "bg-white/10 text-white/80 ring-white/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "live"
                    ? "bg-green-300 animate-pulse"
                    : "bg-white/60"
                }`}
              />
              {status === "live"
                ? "Partida en vivo"
                : status === "finished"
                  ? "Partida finalizada"
                  : "Esperando inicio"}
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold mt-3">
              Bingo en vivo
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/mis-cartones"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold"
            >
              Mis cartones
            </Link>
            <Link
              href="/comprar"
              className="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-sm font-bold"
            >
              Comprar cartón
            </Link>
          </div>
        </header>

        <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Big ball */}
          <div className="bg-white/5 rounded-3xl ring-1 ring-white/10 p-10 flex flex-col items-center justify-center min-h-[420px]">
            <div className="text-sm uppercase tracking-widest text-primary-100/70">
              Último número
            </div>
            <div className="mt-6">
              {lastCalled ? (
                <div className="animate-pop">
                  <BingoBall n={lastCalled} size={240} gold />
                </div>
              ) : (
                <div className="w-60 h-60 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-white/60 text-lg">
                  Esperando…
                </div>
              )}
            </div>
            <div className="mt-6 text-primary-100/80">
              <span className="font-bold text-accent-300 text-2xl">
                {drawn.length}
              </span>{" "}
              / 75 cantados
            </div>
          </div>

          {/* Winners + recent */}
          <aside className="space-y-4">
            <div className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-5">
              <div className="text-xs uppercase tracking-wide text-primary-100/70 mb-3">
                Últimos cantados
              </div>
              <div className="flex flex-wrap gap-2">
                {drawn
                  .slice(-12)
                  .reverse()
                  .map((n, i) => (
                    <BingoBall
                      key={`${n}-${i}`}
                      n={n}
                      size={48}
                      gold={i === 0}
                    />
                  ))}
                {drawn.length === 0 && (
                  <span className="text-white/60 text-sm">Sin números aún</span>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-5">
              <div className="text-xs uppercase tracking-wide text-primary-100/70 mb-3">
                🏆 Ganadores
              </div>
              {winners.length === 0 ? (
                <p className="text-sm text-white/70">Aún sin ganadores.</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-auto">
                  {winners
                    .slice()
                    .reverse()
                    .map((w, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                      >
                        <span className="font-semibold">{w.ownerName}</span>
                        <span className="text-accent-300 text-xs uppercase">
                          {w.pattern}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </aside>
        </div>

        {/* Number board */}
        <div className="mt-10 bg-white/5 rounded-2xl ring-1 ring-white/10 p-5">
          <div className="text-xs uppercase tracking-wide text-primary-100/70 mb-3">
            Tablero
          </div>
          <div className="grid grid-cols-15 gap-1.5"
               style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
            {Array.from({ length: 75 }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className={`text-xs font-mono text-center rounded py-1.5 font-bold ${
                  drawn.includes(n)
                    ? n === lastCalled
                      ? "bg-accent-500 text-white animate-pop"
                      : "bg-primary-500 text-white"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
