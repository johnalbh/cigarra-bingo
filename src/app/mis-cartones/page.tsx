"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Carton } from "@/types/bingo";

export default function MisCartonesPage() {
  const [cartones, setCartones] = useState<Carton[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids: string[] = JSON.parse(
      localStorage.getItem("cigarra_bingo_cartones") ?? "[]"
    );
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      ids.map((id) =>
        fetch(`/api/cartones/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.carton as Carton | undefined)
      )
    ).then((all) => {
      setCartones(all.filter((c): c is Carton => Boolean(c)));
      setLoading(false);
    });
  }, []);

  function clearLocal() {
    if (confirm("¿Eliminar todos los cartones guardados en este navegador?")) {
      localStorage.removeItem("cigarra_bingo_cartones");
      setCartones([]);
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-extrabold text-primary-900">
            Mis cartones
          </h1>
          <p className="text-slate-600 mt-2">
            Los cartones que has comprado en este dispositivo.
          </p>
        </div>
        <Link
          href="/comprar"
          className="px-5 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-semibold"
        >
          Comprar más
        </Link>
      </div>

      {loading ? (
        <div className="mt-10 text-slate-500">Cargando…</div>
      ) : cartones.length === 0 ? (
        <div className="mt-10 bg-primary-50 border border-primary-100 rounded-2xl p-10 text-center">
          <p className="text-lg text-primary-900 font-semibold">
            Aún no tienes cartones.
          </p>
          <p className="text-slate-600 mt-2">
            Compra el primero para participar en el bingo.
          </p>
          <Link
            href="/comprar"
            className="inline-block mt-5 px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold"
          >
            Comprar cartón
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cartones.map((c) => (
              <Link
                key={c.id}
                href={`/carton/${c.id}`}
                className="block rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6 hover:scale-[1.02] transition shadow-lg"
              >
                <div className="text-xs uppercase tracking-wide opacity-80">
                  Cartón
                </div>
                <div className="text-2xl font-extrabold font-mono mt-1">
                  {c.code}
                </div>
                <div className="text-xs opacity-80 mt-3">
                  {c.ownerName} · Abrir →
                </div>
              </Link>
            ))}
          </div>
          <button
            onClick={clearLocal}
            className="mt-10 text-xs text-slate-400 hover:text-red-500"
          >
            Borrar cartones de este navegador
          </button>
        </>
      )}
    </section>
  );
}
