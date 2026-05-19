# Cigarra Bingo Virtual

Bingo virtual para eventos de **Fundación Cigarra**. Permite publicar el evento, vender cartones online, jugar en vivo y validar premios.

## Stack
- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4 (config inline en `globals.css`)
- Motion (animaciones)
- Branding y colores de Cigarra

## Páginas
- `/` — Landing del evento
- `/comprar` — Compra de cartones (demo, sin pasarela real)
- `/mis-cartones` — Cartones del comprador (localStorage)
- `/carton/[id]` — Cartón individual con auto-marcado
- `/jugar` — Vista pública del juego en vivo
- `/admin` — Panel del organizador (sacar números, validar)

## Desarrollo
```bash
npm install
npm run dev
# http://localhost:3000
```

## Deploy a Vercel
```bash
npx vercel --prod
```

> **Nota:** el estado del juego vive en memoria del runtime serverless (demo).
> Para producción, migrar `src/lib/store.ts` a **Vercel KV** (Upstash Redis) o una BD persistente.
