import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/images/logo-principal.webp"
            alt="Fundación Cigarra"
            width={140}
            height={40}
            className="h-9 w-auto"
            priority
          />
          <span className="hidden sm:inline text-sm font-semibold text-primary-700 group-hover:text-primary-500 transition">
            Bingo Virtual
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link
            href="/jugar"
            className="px-3 py-2 rounded-lg text-slate-700 hover:text-primary-600 hover:bg-primary-50 transition"
          >
            En vivo
          </Link>
          <Link
            href="/talonario"
            className="px-3 py-2 rounded-lg text-slate-700 hover:text-primary-600 hover:bg-primary-50 transition"
          >
            Mi talonario
          </Link>
          <Link
            href="/comprar"
            className="px-3 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-semibold shadow-sm transition"
          >
            Comprar cartón
          </Link>
        </nav>
      </div>
    </header>
  );
}
