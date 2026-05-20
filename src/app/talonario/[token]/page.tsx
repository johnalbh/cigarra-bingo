"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CartonGrid } from "@/components/CartonGrid";
import { BingoBall } from "@/components/BingoBall";
import { evaluateCarton } from "@/lib/bingo";
import type { Carton, GameState, Purchase, WinPattern } from "@/types/bingo";

const PATTERN_LABEL: Record<WinPattern, string> = {
  line: "Línea",
  diagonal: "Diagonal",
  corners: "Cuatro esquinas",
  blackout: "Bingo completo",
};

type TalonarioData = {
  email: string;
  ownerName: string;
  totalCartones: number;
  totalPurchases: number;
  totalAmount: number;
  purchases: Purchase[];
  cartones: Carton[];
};

export default function TalonarioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<TalonarioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [view, setView] = useState<"grid" | "single">("grid");
  const [activeCartonId, setActiveCartonId] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [validations, setValidations] = useState<
    Record<string, { won: boolean; pattern: WinPattern | null }>
  >({});
  const [copied, setCopied] = useState(false);

  // Fetch talonario
  useEffect(() => {
    fetch(`/api/talonario/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) setNotFound(true);
        else {
          setData(d);
          if (d.cartones?.[0]) setActiveCartonId(d.cartones[0].id);
        }
      })
      .catch(() => setNotFound(true));
  }, [token]);

  // Poll game state
  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/game/state", { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          if (alive) setGame(j.game);
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

  const drawn = game?.drawn ?? [];
  const lastCalled = drawn[drawn.length - 1];

  const cartones = data?.cartones ?? [];
  const purchasesById = useMemo(() => {
    const m = new Map<string, Purchase>();
    for (const p of data?.purchases ?? []) m.set(p.id, p);
    return m;
  }, [data]);

  // Compute "close to winning": how many marks needed to complete a line/column
  const insights = useMemo(() => {
    return cartones.map((c) => {
      const drawnSet = new Set(drawn);
      const mark = (r: number, col: number) => {
        const v = c.numbers[r][col];
        return v === null || drawnSet.has(v as number);
      };
      const localWin = evaluateCarton(c, drawn);
      let bestRowHits = 0;
      for (let r = 0; r < 5; r++) {
        let h = 0;
        for (let col = 0; col < 5; col++) if (mark(r, col)) h++;
        bestRowHits = Math.max(bestRowHits, h);
      }
      for (let col = 0; col < 5; col++) {
        let h = 0;
        for (let r = 0; r < 5; r++) if (mark(r, col)) h++;
        bestRowHits = Math.max(bestRowHits, h);
      }
      return { id: c.id, hits: bestRowHits, win: localWin.won, pattern: localWin.pattern };
    });
  }, [cartones, drawn]);

  async function validate(cartonId: string) {
    setValidating(cartonId);
    try {
      const res = await fetch("/api/game/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartonId }),
      });
      const r = await res.json();
      setValidations((prev) => ({ ...prev, [cartonId]: r }));
    } finally {
      setValidating(null);
    }
  }

  async function copyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  if (notFound) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-primary-900">
          Talonario no encontrado
        </h1>
        <p className="text-slate-600 mt-2">
          Este enlace no es válido o expiró. Solicita uno nuevo con tu email.
        </p>
        <Link
          href="/talonario"
          className="inline-block mt-5 px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold"
        >
          Solicitar mi enlace
        </Link>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-16 text-slate-500">
        Cargando talonario…
      </section>
    );
  }

  const active = cartones.find((c) => c.id === activeCartonId) ?? cartones[0];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header / summary */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary-100/80">
              Mi talonario
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
              Hola, {data.ownerName.split(" ")[0]}
            </h1>
            <p className="text-primary-100/80 mt-1 text-sm">{data.email}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={copyLink}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold"
            >
              {copied ? "✓ Copiado" : "🔗 Copiar enlace"}
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold"
            >
              🖨 Imprimir
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Cartones" value={data.totalCartones} />
          <Stat label="Compras" value={data.totalPurchases} />
          <Stat
            label="Aportado"
            value={`COP ${data.totalAmount.toLocaleString("es-CO")}`}
          />
        </div>
      </div>

      {/* Live ball */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {lastCalled ? (
            <BingoBall n={lastCalled} size={70} gold />
          ) : (
            <div className="w-[70px] h-[70px] rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
              esperando
            </div>
          )}
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {game?.status === "live"
                ? "EN VIVO"
                : game?.status === "paused"
                  ? "Pausado"
                  : game?.status === "finished"
                    ? "Finalizado"
                    : "Esperando inicio"}
            </div>
            <div className="font-bold text-primary-900">
              {drawn.length} / 75 números cantados
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              view === "grid"
                ? "bg-primary-500 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            ▦ Talonario
          </button>
          <button
            onClick={() => setView("single")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              view === "single"
                ? "bg-primary-500 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            ◧ Enfoque
          </button>
          <Link
            href="/jugar"
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-bold"
          >
            Pantalla en vivo →
          </Link>
        </div>
      </div>

      {/* Cartones */}
      {view === "grid" ? (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cartones.map((c) => {
            const ins = insights.find((i) => i.id === c.id);
            const v = validations[c.id];
            return (
              <div key={c.id} className="space-y-2">
                <CartonGrid
                  carton={c}
                  drawn={drawn}
                  highlight={lastCalled ?? null}
                  size="sm"
                />
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded font-bold ${
                      ins?.win
                        ? "bg-green-100 text-green-800"
                        : ins && ins.hits >= 4
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {ins?.win
                      ? `¡${PATTERN_LABEL[ins.pattern!]}!`
                      : `${ins?.hits ?? 0}/5 en mejor línea`}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setActiveCartonId(c.id);
                        setView("single");
                      }}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold print:hidden"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => validate(c.id)}
                      disabled={validating === c.id}
                      className="px-2 py-1 rounded bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold print:hidden"
                    >
                      {validating === c.id ? "…" : "BINGO"}
                    </button>
                  </div>
                </div>
                {v && (
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      v.won
                        ? "bg-green-50 text-green-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {v.won
                      ? `✓ Registrado: ${PATTERN_LABEL[v.pattern!]}`
                      : "Aún no es bingo"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : active ? (
        <div className="mt-8 grid lg:grid-cols-[1fr_280px] gap-6">
          <div>
            <CartonGrid
              carton={active}
              drawn={drawn}
              highlight={lastCalled ?? null}
              size="lg"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
              <button
                onClick={() => validate(active.id)}
                disabled={validating === active.id}
                className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold shadow-lg shadow-accent-500/30"
              >
                {validating === active.id ? "Verificando…" : "¡BINGO!"}
              </button>
              {validations[active.id] && (
                <span
                  className={`text-sm px-3 py-1 rounded ${
                    validations[active.id].won
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {validations[active.id].won
                    ? `✓ ${PATTERN_LABEL[validations[active.id].pattern!]}`
                    : "Aún no es bingo"}
                </span>
              )}
            </div>
          </div>
          <aside className="space-y-2 print:hidden">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Tus cartones
            </div>
            <div className="space-y-1 max-h-[520px] overflow-auto pr-1">
              {cartones.map((c) => {
                const ins = insights.find((i) => i.id === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCartonId(c.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      c.id === active.id
                        ? "bg-primary-50 border-primary-300"
                        : "bg-white border-slate-200 hover:border-primary-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-primary-700">
                        #{c.code}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          ins?.win
                            ? "bg-green-100 text-green-800"
                            : ins && ins.hits >= 4
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ins?.win ? "BINGO" : `${ins?.hits ?? 0}/5`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}

      {/* Purchases list */}
      <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-primary-900">Mis compras</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {data.purchases.map((p) => (
            <li
              key={p.id}
              className="py-3 flex items-center justify-between gap-3 flex-wrap"
            >
              <div>
                <div className="font-semibold text-primary-900">
                  {p.quantity} cartón{p.quantity === 1 ? "" : "es"}
                </div>
                <div className="text-xs text-slate-500 font-mono">{p.id}</div>
              </div>
              <div className="text-slate-700">
                COP {p.amount.toLocaleString("es-CO")}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(p.createdAt).toLocaleString("es-CO")}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style jsx global>{`
        @media print {
          header, footer, .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <div className="text-xs uppercase tracking-wide text-primary-100/80">
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-extrabold mt-0.5">{value}</div>
    </div>
  );
}
