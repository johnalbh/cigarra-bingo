import Image from "next/image";
import Link from "next/link";
import { BingoBall } from "@/components/BingoBall";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-mesh text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-accent-200 text-xs font-semibold uppercase tracking-wide ring-1 ring-white/20">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              Evento solidario · 2026
            </span>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold leading-tight">
              <span className="text-white">Bingo Virtual</span>
              <br />
              <span className="text-gradient">de Cigarra</span>
            </h1>
            <p className="mt-5 text-lg text-primary-100/90 max-w-xl">
              Juega en vivo, gana premios y apoya la educación de los niños y niñas
              de Ciudad Bolívar. Cada cartón es un acto de generosidad.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/comprar"
                className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold shadow-lg shadow-accent-500/30 transition"
              >
                Comprar mi cartón · COP 25.000
              </Link>
              <Link
                href="/jugar"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold ring-1 ring-white/30 transition"
              >
                Ver juego en vivo
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <Stat label="Cartones" value="∞" />
              <Stat label="Premios" value="6" />
              <Stat label="Beneficiarios" value="+300" />
            </dl>
          </div>

          {/* Floating bingo balls */}
          <div className="relative h-80 lg:h-[420px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-72">
                <div className="absolute inset-0 rounded-full bg-accent-500/20 blur-3xl" />
                <div className="absolute inset-6 rounded-full bg-white/5 ring-1 ring-white/15 animate-spin-slow" />
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 pulse-ring">
                  <BingoBall n={7} size={86} gold />
                </div>
                <div className="absolute bottom-2 -left-2">
                  <BingoBall n={23} size={68} />
                </div>
                <div className="absolute top-6 -right-3">
                  <BingoBall n={42} size={62} />
                </div>
                <div className="absolute bottom-6 -right-6">
                  <BingoBall n={58} size={74} />
                </div>
                <div className="absolute top-1/2 left-3 -translate-y-1/2">
                  <BingoBall n={66} size={56} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-primary-900">
          ¿Cómo funciona?
        </h2>
        <p className="text-center text-slate-600 mt-3 max-w-2xl mx-auto">
          Compra tu cartón, recíbelo al instante y juega en vivo desde tu
          celular o computador. Los cartones se marcan solos.
        </p>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Step
            n={1}
            title="Compra tu cartón"
            desc="Cada cartón cuesta COP 25.000. Puedes comprar varios. Te llegan al instante."
          />
          <Step
            n={2}
            title="Únete en vivo"
            desc="El día del evento entra a /jugar. Los números se cantan en tiempo real."
          />
          <Step
            n={3}
            title="¡Bingo!"
            desc="Cuando completes el patrón, valida tu cartón con un clic y reclama tu premio."
          />
        </div>
      </section>

      {/* Prizes */}
      <section className="bg-primary-50 border-y border-primary-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-primary-900">
            Premios y patrones
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Prize title="Línea" subtitle="Cualquier fila o columna" emoji="—" />
            <Prize title="Diagonal" subtitle="De esquina a esquina" emoji="╲" />
            <Prize title="Cuatro esquinas" subtitle="Las 4 puntas" emoji="◰◳◱◲" />
            <Prize title="Bingo completo" subtitle="Todo el cartón" emoji="★" />
          </div>
        </div>
      </section>

      {/* About Cigarra */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <Image
          src="/images/logo-principal.webp"
          alt="Fundación Cigarra"
          width={520}
          height={300}
          className="rounded-2xl shadow-md object-contain bg-white p-8"
        />
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-900">
            Apoyas a <span className="text-gradient">Fundación Cigarra</span>
          </h2>
          <p className="text-slate-700 mt-4 leading-relaxed">
            Trabajamos con niños, niñas y familias de Ciudad Bolívar (Bogotá)
            ofreciendo educación, alimentación y acompañamiento integral. Cada
            cartón que compras se transforma en oportunidades reales.
          </p>
          <a
            href="https://www.cigarra.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 text-primary-600 font-semibold hover:text-primary-500"
          >
            Conoce más en cigarra.org →
          </a>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-3xl font-extrabold text-accent-300">{value}</dt>
      <dd className="text-sm text-primary-100/80">{label}</dd>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition">
      <div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center mb-4">
        {n}
      </div>
      <h3 className="text-lg font-bold text-primary-900">{title}</h3>
      <p className="text-slate-600 mt-2 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Prize({
  title,
  subtitle,
  emoji,
}: {
  title: string;
  subtitle: string;
  emoji: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-primary-100">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-bold text-primary-800">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
    </div>
  );
}
