"use client";

import { useEffect, useState } from "react";
import { BingoBall } from "@/components/BingoBall";
import type { GameState } from "@/types/bingo";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [validateInput, setValidateInput] = useState("");
  const [validateResult, setValidateResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("cigarra_admin_token");
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    async function poll() {
      const res = await fetch("/api/game/state", { cache: "no-store" });
      const data = await res.json();
      setGame(data.game);
      setStats(data.stats);
    }
    poll();
    const t = setInterval(poll, 1500);
    return () => clearInterval(t);
  }, [authed]);

  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Try draw with token, if 401 => wrong token. We'll just trust it locally and probe.
    const probe = await fetch("/api/game/state", { cache: "no-store" });
    if (!probe.ok) {
      setError("No se pudo conectar");
      return;
    }
    sessionStorage.setItem("cigarra_admin_token", token);
    setAuthed(true);
  }

  async function drawNext() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/game/draw", {
        method: "POST",
        headers: { "x-admin-token": token },
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error");
        if (res.status === 401) {
          sessionStorage.removeItem("cigarra_admin_token");
          setAuthed(false);
        }
        return;
      }
      const data = await res.json();
      setGame(data.game);
    } finally {
      setBusy(false);
    }
  }

  async function resetGame() {
    if (!confirm("¿Reiniciar la partida? Se borrarán números cantados y ganadores."))
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/game/reset", {
        method: "POST",
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        const data = await res.json();
        setGame(data.game);
      }
    } finally {
      setBusy(false);
    }
  }

  async function validate() {
    if (!validateInput) return;
    setValidateResult(null);
    const res = await fetch("/api/game/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartonId: validateInput }),
    });
    const data = await res.json();
    setValidateResult(data);
  }

  if (!authed) {
    return (
      <section className="max-w-md mx-auto px-4 py-20">
        <h1 className="text-3xl font-extrabold text-primary-900">
          Panel del organizador
        </h1>
        <p className="text-slate-600 mt-2 text-sm">
          Ingresa el token de administrador para gestionar la partida.
        </p>
        <form onSubmit={authenticate} className="mt-6 space-y-3">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN (default: cigarra-demo)"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 outline-none"
          />
          <button className="w-full px-4 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold">
            Entrar
          </button>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </form>
        <p className="text-xs text-slate-500 mt-6">
          El token se define con la env var <code>ADMIN_TOKEN</code>. En la demo
          el valor por defecto es <code>cigarra-demo</code>.
        </p>
      </section>
    );
  }

  const drawn = game?.drawn ?? [];
  const lastCalled = drawn[drawn.length - 1];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Organizador
          </span>
          <h1 className="text-4xl font-extrabold text-primary-900">
            Control de partida
          </h1>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("cigarra_admin_token");
            setAuthed(false);
          }}
          className="text-sm text-slate-500 hover:text-red-600"
        >
          Salir
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Estado" value={game?.status ?? "—"} />
        <StatCard label="Cantados" value={`${drawn.length}/75`} />
        <StatCard label="Cartones" value={stats?.cartones ?? 0} />
        <StatCard label="Compras" value={stats?.purchases ?? 0} />
        <StatCard label="Ganadores" value={stats?.winners ?? 0} />
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Draw */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary-900">Sacar número</h2>
          <div className="mt-6 flex items-center justify-center min-h-[200px]">
            {lastCalled ? (
              <div className="animate-pop">
                <BingoBall n={lastCalled} size={160} gold />
              </div>
            ) : (
              <div className="w-40 h-40 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                —
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={drawNext}
              disabled={busy || game?.status === "finished"}
              className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold shadow-lg shadow-accent-500/30"
            >
              {busy ? "…" : "Sacar siguiente"}
            </button>
            <button
              onClick={resetGame}
              disabled={busy}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Reiniciar
            </button>
          </div>
          {error && (
            <div className="mt-4 text-red-600 text-sm text-center">{error}</div>
          )}
        </div>

        {/* Validate */}
        <aside className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary-900">
            Validar cartón ganador
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pega el ID del cartón (e.g. <code>crt_...</code>) o pídele el código
            al jugador.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={validateInput}
              onChange={(e) => setValidateInput(e.target.value)}
              placeholder="crt_..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none text-sm font-mono"
            />
            <button
              onClick={validate}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"
            >
              Validar
            </button>
          </div>
          {validateResult && (
            <div
              className={`mt-4 rounded-xl p-3 text-sm ${
                validateResult.won
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {validateResult.error ? (
                <span>{validateResult.error}</span>
              ) : validateResult.won ? (
                <>
                  <div className="font-bold">
                    ✓ Ganador — {validateResult.pattern}
                  </div>
                  <div className="text-xs mt-1">
                    {validateResult.carton?.ownerName} · #
                    {validateResult.carton?.code}
                  </div>
                </>
              ) : (
                <div>Sin patrón ganador todavía.</div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Board */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
          Tablero
        </div>
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
        >
          {Array.from({ length: 75 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`text-xs font-mono text-center rounded py-1.5 font-bold ${
                drawn.includes(n)
                  ? n === lastCalled
                    ? "bg-accent-500 text-white"
                    : "bg-primary-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Winners list */}
      {game && game.winners.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-bold text-primary-900 mb-3">
            🏆 Ganadores registrados
          </h2>
          <ul className="divide-y divide-slate-100">
            {game.winners.map((w, i) => (
              <li
                key={i}
                className="py-2 flex items-center justify-between text-sm"
              >
                <span className="font-semibold">{w.ownerName}</span>
                <span className="font-mono text-slate-500">
                  {w.cartonId.slice(0, 14)}…
                </span>
                <span className="text-accent-600 uppercase text-xs font-bold">
                  {w.pattern}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-xl font-extrabold text-primary-900 mt-1">
        {value}
      </div>
    </div>
  );
}
