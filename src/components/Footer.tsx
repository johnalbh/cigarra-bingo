import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/images/logo.webp"
              alt="Cigarra"
              width={120}
              height={36}
              className="h-9 w-auto bg-white rounded px-2 py-1"
            />
          </div>
          <p className="text-sm text-primary-100/80 leading-relaxed">
            Fundación Cigarra — Educación con propósito para los niños y niñas
            de Ciudad Bolívar.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Bingo Virtual</h4>
          <p className="text-sm text-primary-100/80">
            Cada cartón aporta a nuestros programas educativos. ¡Juega y apoya!
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Contacto</h4>
          <ul className="text-sm text-primary-100/80 space-y-1">
            <li>
              <a className="hover:text-accent-300" href="https://www.cigarra.org">
                www.cigarra.org
              </a>
            </li>
            <li>bingo@cigarra.org</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-700/60 py-4 text-center text-xs text-primary-100/70">
        © {new Date().getFullYear()} Fundación Cigarra · Bingo Virtual
      </div>
    </footer>
  );
}
