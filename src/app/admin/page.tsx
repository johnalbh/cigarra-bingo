"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BingoBall } from "@/components/BingoBall";
import type { Carton, GameState } from "@/types/bingo";

const PATTERN_LABEL: Record<string, string> = {
  line: "Línea",
  diagonal: "Diagonal",
  corners: "Cuatro esquinas",
  blackout: "Bingo completo",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [cartones, setCartones] = useState<Carton[]>([]);
  const [search, setSearch] = useState("");
  const [validateInput, setValidateInput] = useState("");
  const [validateResult, setValidateResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Manual generation form
  const [genName, setGenName] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [genQty, setGenQty] = useState(1);
  const [genResult, setGenResult] = useState<Carton[] | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("cigarra_admin_token");
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  async function refreshAll() {
    const [stateRes, cartonesRes] = await Promise.all([
      fetch("/api/game/state", { cache: "no-store" }),
      fetch("/api/admin/cartones", {
        cache: "no-store",
        headers: { "x-admin-token": token },
      }),
    ]);
    if (stateRes.ok) {
      const data = await stateRes.json();
      setGame(data.game);
      setStats(data.stats);
    }
    if (cartonesRes.ok) {
      const data = await cartonesRes.json();
      setCartones(data.cartones ?? []);
    } else if (cartonesRes.status === 401) {
      sessionStorage.removeItem("cigarra_admin_token");
      setAuthed(false);
    }
  }

  useEffect(() => {
    if (!authed) return;
    refreshAll();
    const t = setInterval(refreshAll, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const probe = await fetch("/api/admin/cartones", {
      headers: { "x-admin-token": token },
    });
    if (probe.status === 401) {
      setError("Token incorrecto");
      return;
    }
    if (!probe.ok) {
      setError("No se pudo conectar");
      return;
    }
    sessionStorage.setItem("cigarra_admin_token", token);
    setAuthed(true);
  }

  async function control(action: "start" | "pause" | "finish") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/game/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error");
        return;
      }
      const data = await res.json();
      setGame(data.game);
    } finally {
      setBusy(false);
    }
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
      body: JSON.stringify({ cartonId: validateInput.trim() }),
    });
    const data = await res.json();
    setValidateResult(data);
  }

  async function generateManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenResult(null);
    const res = await fetch("/api/admin/cartones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify({
        ownerName: genName,
        ownerEmail: genEmail || undefined,
        quantity: genQty,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setGenResult(data.cartones);
    setGenName("");
    setGenEmail("");
    setGenQty(1);
    refreshAll();
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
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
      </section>
    );
  }

  const drawn = game?.drawn ?? [];
  const lastCalled = drawn[drawn.length - 1];
  const status = game?.status ?? "idle";

  const filteredCartones = cartones.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q) ||
      c.ownerEmail.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Estado" value={status} highlight={status === "live"} />
        <StatCard label="Cantados" value={`${drawn.length}/75`} />
        <StatCard label="Cartones" value={stats?.cartones ?? 0} />
        <StatCard label="Compras" value={stats?.purchases ?? 0} />
        <StatCard label="Ganadores" value={stats?.winners ?? 0} />
      </div>

      {/* Game controls + draw */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-primary-900">
              Control del juego
            </h2>
            <Link
              href="/jugar"
              target="_blank"
              className="text-sm text-primary-600 hover:underline"
            >
              Abrir pantalla en vivo →
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ControlBtn
              onClick={() => control("start")}
              disabled={busy || status === "live" || status === "finished"}
              tone="success"
            >
              ▶ Iniciar
            </ControlBtn>
            <ControlBtn
              onClick={() => control("pause")}
              disabled={busy || status !== "live"}
              tone="neutral"
            >
              ⏸ Pausar
            </ControlBtn>
            <ControlBtn
              onClick={() => control("finish")}
              disabled={busy || status === "finished" || status === "idle"}
              tone="warn"
            >
              ⏹ Finalizar
            </ControlBtn>
            <ControlBtn onClick={resetGame} disabled={busy} tone="neutral">
              ↻ Reiniciar
            </ControlBtn>
          </div>

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

          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={drawNext}
              disabled={
                busy || status === "finished" || status === "paused"
              }
              className="px-7 py-4 rounded-2xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-extrabold text-lg shadow-lg shadow-accent-500/30 transition active:scale-[0.98]"
            >
              🎱 Cantar siguiente número
            </button>
          </div>
          {status === "paused" && (
            <p className="text-center text-sm text-amber-700 mt-3">
              Partida pausada — presiona ▶ Iniciar para retomar.
            </p>
          )}
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
            Pega el ID del cartón o búscalo abajo en la tabla.
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
                    ✓ Ganador — {PATTERN_LABEL[validateResult.pattern]}
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

      {/* Manual generation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary-900">
              Generar cartones manualmente
            </h2>
            <p className="text-sm text-slate-500">
              Para asistentes presenciales, regalos a sponsors u organización
              interna. No requiere compra online.
            </p>
          </div>
        </div>
        <form
          onSubmit={generateManual}
          className="mt-4 grid sm:grid-cols-[2fr_2fr_1fr_auto] gap-3"
        >
          <input
            required
            value={genName}
            onChange={(e) => setGenName(e.target.value)}
            placeholder="Nombre del titular"
            className="px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none text-sm"
          />
          <input
            type="email"
            value={genEmail}
            onChange={(e) => setGenEmail(e.target.value)}
            placeholder="Email (opcional)"
            className="px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none text-sm"
          />
          <input
            type="number"
            min={1}
            max={50}
            value={genQty}
            onChange={(e) => setGenQty(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none text-sm"
          />
          <button className="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-bold">
            Generar
          </button>
        </form>
        {genResult && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
            <div className="font-bold text-green-800">
              ✓ {genResult.length} cartón
              {genResult.length === 1 ? "" : "es"} generado
              {genResult.length === 1 ? "" : "s"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {genResult.map((c) => (
                <Link
                  key={c.id}
                  href={`/carton/${c.id}`}
                  target="_blank"
                  className="font-mono text-xs px-2 py-1 rounded bg-white border border-green-200 text-green-800 hover:bg-green-100"
                >
                  #{c.code}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cartones list */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-primary-900">
            Cartones ({cartones.length})
          </h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre, email…"
            className="px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none text-sm w-full sm:w-72"
          />
        </div>
        {filteredCartones.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Sin cartones aún.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left py-2 px-2">Código</th>
                  <th className="text-left py-2 px-2">Titular</th>
                  <th className="text-left py-2 px-2 hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left py-2 px-2 hidden md:table-cell">
                    ID
                  </th>
                  <th className="text-right py-2 px-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCartones.slice(0, 100).map((c) => (
                  <tr key={c.id} className="hover:bg-primary-50/40">
                    <td className="py-2 px-2 font-mono font-bold text-primary-700">
                      #{c.code}
                    </td>
                    <td className="py-2 px-2">{c.ownerName}</td>
                    <td className="py-2 px-2 hidden sm:table-cell text-slate-500">
                      {c.ownerEmail}
                    </td>
                    <td className="py-2 px-2 hidden md:table-cell font-mono text-xs text-slate-400">
                      {c.id.slice(0, 18)}…
                    </td>
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setValidateInput(c.id);
                          validate();
                        }}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 mr-1"
                      >
                        Validar
                      </button>
                      <Link
                        href={`/carton/${c.id}`}
                        target="_blank"
                        className="text-xs px-2 py-1 rounded bg-primary-500 hover:bg-primary-600 text-white"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCartones.length > 100 && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Mostrando los primeros 100 — refina la búsqueda para ver más.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Number board */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
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

      {/* Results */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-extrabold">🏆 Resultados</h2>
          <span className="text-sm text-primary-100/80">
            {(game?.winners ?? []).length} ganador
            {(game?.winners ?? []).length === 1 ? "" : "es"}
          </span>
        </div>
        {!game || game.winners.length === 0 ? (
          <p className="mt-4 text-primary-100/80">
            Aún sin ganadores registrados.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-white/10">
            {game.winners
              .slice()
              .reverse()
              .map((w, i) => (
                <li
                  key={i}
                  className="py-3 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div>
                    <div className="font-bold text-lg">{w.ownerName}</div>
                    <div className="text-xs text-primary-100/70">
                      {new Date(w.at).toLocaleTimeString("es-CO")}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-bold uppercase">
                    {PATTERN_LABEL[w.pattern]}
                  </span>
                  <Link
                    href={`/carton/${w.cartonId}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold"
                  >
                    Abrir cartón
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: any;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "bg-green-50 border-green-300"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={`text-xl font-extrabold mt-1 ${
          highlight ? "text-green-700" : "text-primary-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "success" | "neutral" | "warn";
}) {
  const tones = {
    success:
      "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/30",
    neutral: "bg-slate-100 hover:bg-slate-200 text-slate-800",
    warn: "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30",
  } as const;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
