import type { Carton, GameState, Purchase, Winner } from "@/types/bingo";
import {
  evaluateCarton,
  generateCartonCode,
  generateCartonNumbers,
  nextRandomNumber,
} from "./bingo";

/**
 * In-memory store for the demo.
 *
 * NOTE on production: Vercel serverless functions don't share memory between
 * invocations, so this works only when the same instance is reused (warm) or
 * for short-lived demos. For real production, replace with Vercel KV / Upstash.
 *
 * We attach state to globalThis so that across HMR / warm starts it persists
 * for the lifetime of the process.
 */
type Store = {
  cartones: Map<string, Carton>;
  purchases: Map<string, Purchase>;
  game: GameState;
  adminToken: string;
};

const globalStore = globalThis as unknown as { __cigarraBingo?: Store };

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function freshGame(): GameState {
  return {
    status: "idle",
    drawn: [],
    startedAt: null,
    lastDrawAt: null,
    winners: [],
  };
}

function init(): Store {
  return {
    cartones: new Map(),
    purchases: new Map(),
    game: freshGame(),
    adminToken: process.env.ADMIN_TOKEN ?? "cigarra-demo",
  };
}

function store(): Store {
  if (!globalStore.__cigarraBingo) {
    globalStore.__cigarraBingo = init();
  }
  return globalStore.__cigarraBingo;
}

// ─── Purchases / Cartones ───────────────────────────────────────────────

export const CARTON_PRICE_COP = 25000;

export function createPurchase(input: {
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  quantity: number;
}): { purchase: Purchase; cartones: Carton[] } {
  const s = store();
  const quantity = Math.max(1, Math.min(20, Math.floor(input.quantity)));
  const purchaseId = makeId("pur");
  const cartones: Carton[] = [];

  for (let i = 0; i < quantity; i++) {
    const id = makeId("crt");
    const carton: Carton = {
      id,
      code: generateCartonCode(),
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
      numbers: generateCartonNumbers(),
      createdAt: Date.now(),
      purchaseId,
    };
    s.cartones.set(id, carton);
    cartones.push(carton);
  }

  const purchase: Purchase = {
    id: purchaseId,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    ownerPhone: input.ownerPhone,
    quantity,
    amount: quantity * CARTON_PRICE_COP,
    currency: "COP",
    status: "paid",
    cartonIds: cartones.map((c) => c.id),
    createdAt: Date.now(),
  };

  s.purchases.set(purchaseId, purchase);
  return { purchase, cartones };
}

export function getCarton(id: string): Carton | undefined {
  return store().cartones.get(id);
}

export function listCartonesByIds(ids: string[]): Carton[] {
  const s = store();
  return ids
    .map((id) => s.cartones.get(id))
    .filter((c): c is Carton => Boolean(c));
}

export function listAllCartones(): Carton[] {
  return Array.from(store().cartones.values());
}

// ─── Game ───────────────────────────────────────────────────────────────

export function getGameState(): GameState {
  return store().game;
}

export function drawNext(): { number: number | null; state: GameState } {
  const s = store();
  if (s.game.status === "idle") {
    s.game.status = "live";
    s.game.startedAt = Date.now();
  }
  const n = nextRandomNumber(s.game.drawn);
  if (n === null) {
    s.game.status = "finished";
    return { number: null, state: s.game };
  }
  s.game.drawn.push(n);
  s.game.lastDrawAt = Date.now();
  return { number: n, state: s.game };
}

export function resetGame(): GameState {
  const s = store();
  s.game = freshGame();
  return s.game;
}

export function validateCarton(cartonId: string): {
  ok: boolean;
  won: boolean;
  pattern: string | null;
  carton?: Carton;
  alreadyRegistered?: boolean;
} {
  const s = store();
  const carton = s.cartones.get(cartonId);
  if (!carton) return { ok: false, won: false, pattern: null };
  const { won, pattern } = evaluateCarton(carton, s.game.drawn);
  let alreadyRegistered = false;
  if (won && pattern) {
    const exists = s.game.winners.find(
      (w) => w.cartonId === cartonId && w.pattern === pattern
    );
    if (exists) {
      alreadyRegistered = true;
    } else {
      const winner: Winner = {
        cartonId,
        pattern,
        ownerName: carton.ownerName,
        at: Date.now(),
      };
      s.game.winners.push(winner);
    }
  }
  return { ok: true, won, pattern, carton, alreadyRegistered };
}

export function isAdmin(token: string | null | undefined): boolean {
  if (!token) return false;
  return token === store().adminToken;
}

export function getStats() {
  const s = store();
  return {
    cartones: s.cartones.size,
    purchases: s.purchases.size,
    drawn: s.game.drawn.length,
    status: s.game.status,
    winners: s.game.winners.length,
  };
}
