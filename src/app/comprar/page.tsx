"use client";

import { useState } from "react";
import Link from "next/link";
import type { Carton, Purchase } from "@/types/bingo";

const PRICE = 25000;

export default function ComprarPage() {
  const [form, setForm] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    purchase: Purchase;
    cartones: Carton[];
    token: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cartones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error procesando la compra");
        return;
      }
      // Persist to localStorage so user can find cartones later
      const existing = JSON.parse(
        localStorage.getItem("cigarra_bingo_cartones") ?? "[]"
      ) as string[];
      const next = Array.from(
        new Set([...existing, ...data.cartones.map((c: Carton) => c.id)])
      );
      localStorage.setItem("cigarra_bingo_cartones", JSON.stringify(next));
      // Persist the magic link token too
      if (data.token) {
        localStorage.setItem("cigarra_bingo_token", data.token);
      }
      setResult(data);
    } catch (err) {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const magicUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/talonario/${result.token}`
        : `/talonario/${result.token}`;

    async function copy() {
      try {
        await navigator.clipboard.writeText(magicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {}
    }

    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
          <div className="text-green-700 text-sm font-semibold">
            ✓ Compra exitosa (demo)
          </div>
          <h1 className="text-3xl font-extrabold mt-1 text-primary-900">
            ¡Listo, {result.purchase.ownerName.split(" ")[0]}!
          </h1>
          <p className="text-slate-700 mt-2">
            Tienes <b>{result.purchase.quantity}</b> cartón
            {result.purchase.quantity === 1 ? "" : "es"} por{" "}
            <b>COP {result.purchase.amount.toLocaleString("es-CO")}</b>.
          </p>
        </div>

        {/* Magic link — primary CTA */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-xs uppercase tracking-widest text-primary-100/80">
            Tu enlace mágico
          </div>
          <h2 className="text-2xl font-extrabold mt-1">
            Accede a todos tus cartones desde un solo lugar
          </h2>
          <p className="text-primary-100/90 mt-2 text-sm">
            Enviamos este enlace a <b>{result.purchase.ownerEmail}</b>.
            Guárdalo: te da acceso a tu talonario completo, en cualquier
            dispositivo.
          </p>
          <div className="mt-5 bg-white/10 ring-1 ring-white/20 rounded-xl p-3 flex items-center gap-2">
            <code className="flex-1 text-xs sm:text-sm break-all font-mono text-accent-200">
              {magicUrl}
            </code>
            <button
              onClick={copy}
              className="px-3 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-bold whitespace-nowrap"
            >
              {copied ? "✓" : "Copiar"}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/talonario/${result.token}`}
              className="px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold shadow-lg shadow-accent-500/30"
            >
              Abrir mi talonario →
            </Link>
            <Link
              href="/jugar"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold ring-1 ring-white/30"
            >
              Ver juego en vivo
            </Link>
          </div>
        </div>

        {/* Codes summary */}
        <div className="mt-8">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
            Tus cartones ({result.cartones.length})
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {result.cartones.map((c) => (
              <Link
                key={c.id}
                href={`/carton/${c.id}`}
                className="block rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white p-4 hover:scale-[1.02] transition shadow"
              >
                <div className="text-[10px] uppercase tracking-wide opacity-80">
                  Cartón
                </div>
                <div className="text-xl font-extrabold font-mono mt-0.5">
                  {c.code}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-extrabold text-primary-900">
        Comprar cartones
      </h1>
      <p className="text-slate-600 mt-2">
        Cada cartón cuesta <b>COP {PRICE.toLocaleString("es-CO")}</b>. Puedes
        comprar hasta 20 por transacción.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5"
      >
        <Field label="Nombre completo">
          <input
            required
            minLength={2}
            value={form.ownerName}
            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            className="input"
            placeholder="María Rodríguez"
          />
        </Field>
        <Field label="Correo electrónico">
          <input
            required
            type="email"
            value={form.ownerEmail}
            onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
            className="input"
            placeholder="tu@correo.com"
          />
        </Field>
        <Field label="Teléfono (opcional)">
          <input
            value={form.ownerPhone}
            onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
            className="input"
            placeholder="+57 300 000 0000"
          />
        </Field>
        <Field label={`Cantidad de cartones (${form.quantity})`}>
          <input
            type="range"
            min={1}
            max={20}
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
            }
            className="w-full accent-accent-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </Field>

        <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Total a pagar</div>
            <div className="text-3xl font-extrabold text-primary-900">
              COP {(PRICE * form.quantity).toLocaleString("es-CO")}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold shadow-lg shadow-accent-500/30"
          >
            {loading ? "Procesando..." : "Pagar y generar cartones"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Modo demo: no se procesa pago real. En producción se integra con
          ePayco (COP) y PayPal (USD), igual que cigarra-web.
        </p>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          background: white;
          font-size: 1rem;
          color: #0a2d4a;
          outline: none;
          transition: all 150ms ease;
        }
        .input:focus {
          border-color: #167bae;
          box-shadow: 0 0 0 4px rgba(22, 123, 174, 0.15);
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
