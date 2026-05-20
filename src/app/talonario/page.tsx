"use client";

import { useState } from "react";
import Link from "next/link";

export default function TalonarioRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    link: string;
    hasPurchases: boolean;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/talonario/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      setResult({ link: data.link, hasPurchases: data.hasPurchases });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-xl mx-auto px-4 sm:px-6 py-16">
      <span className="text-xs uppercase tracking-widest text-primary-600 font-bold">
        Acceso por email
      </span>
      <h1 className="text-4xl font-extrabold text-primary-900 mt-2">
        Ver mi talonario
      </h1>
      <p className="text-slate-600 mt-3">
        Te enviamos un <b>enlace mágico</b> al correo con el que compraste tus
        cartones. Desde ahí ves todos tus talonarios y juegas en vivo.
      </p>

      {result ? (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="text-green-700 text-sm font-semibold">
            ✓ Enlace generado
          </div>
          <h2 className="text-2xl font-extrabold text-primary-900 mt-1">
            {result.hasPurchases
              ? "Tu talonario está listo"
              : "Aún no tienes cartones"}
          </h2>
          <p className="text-slate-700 mt-2 text-sm">
            En producción te lo enviamos por correo. Por ahora, en modo demo,
            puedes abrirlo directamente:
          </p>
          <Link
            href={result.link}
            className="block mt-4 px-5 py-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-center break-all"
          >
            Abrir mi talonario →
          </Link>
          {!result.hasPurchases && (
            <p className="text-xs text-slate-500 mt-3">
              Este email aún no tiene cartones. Si quieres,{" "}
              <Link
                href="/comprar"
                className="text-primary-600 font-semibold underline"
              >
                compra el primero acá
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Tu correo electrónico
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="mt-1.5 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 outline-none"
            />
          </label>
          <button
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold"
          >
            {loading ? "Generando…" : "Enviarme el enlace"}
          </button>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Modo demo: el enlace se muestra acá mismo. En producción se enviará
            por correo.
          </p>
        </form>
      )}

      <div className="mt-10 text-sm text-slate-600">
        ¿Aún no compras?{" "}
        <Link
          href="/comprar"
          className="text-primary-600 font-semibold hover:underline"
        >
          Comprar cartones
        </Link>
      </div>
    </section>
  );
}
