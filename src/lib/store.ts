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
  /** token → email (lowercase) */
  tokenToEmail: Map<string, string>;
  /** email (lowercase) → token */
  emailToToken: Map<string, string>;
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
    tokenToEmail: new Map(),
    emailToToken: new Map(),
    game: freshGame(),
    adminToken: process.env.ADMIN_TOKEN ?? "cigarra-demo",
  };
}

function randomToken(bytes = 16): string {
  // Base36 from crypto random when available, fallback to Math.random
  const out: string[] = [];
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== "undefined" ? (globalThis as any).crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint8Array(bytes);
    cryptoObj.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  for (let i = 0; i < bytes; i++) {
    out.push(Math.floor(Math.random() * 256).toString(16).padStart(2, "0"));
  }
  return out.join("");
}

/**
 * Returns a stable magic-link token per email.
 * Creates one if it doesn't exist.
 */
export function ensureTokenForEmail(email: string): string {
  const s = store();
  const key = email.toLowerCase();
  const existing = s.emailToToken.get(key);
  if (existing) return existing;
  const token = randomToken(20);
  s.emailToToken.set(key, token);
  s.tokenToEmail.set(token, key);
  return token;
}

export function getEmailForToken(token: string): string | undefined {
  return store().tokenToEmail.get(token);
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
}): { purchase: Purchase; cartones: Carton[]; token: string } {
  const s = store();
  const quantity = Math.max(1, Math.min(20, Math.floor(input.quantity)));
  const purchaseId = makeId("pur");
  const ownerEmail = input.ownerEmail.toLowerCase();
  const cartones: Carton[] = [];

  for (let i = 0; i < quantity; i++) {
    const id = makeId("crt");
    const carton: Carton = {
      id,
      code: generateCartonCode(),
      ownerName: input.ownerName,
      ownerEmail,
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
    ownerEmail,
    ownerPhone: input.ownerPhone,
    quantity,
    amount: quantity * CARTON_PRICE_COP,
    currency: "COP",
    status: "paid",
    cartonIds: cartones.map((c) => c.id),
    createdAt: Date.now(),
  };

  s.purchases.set(purchaseId, purchase);
  const token = ensureTokenForEmail(ownerEmail);
  return { purchase, cartones, token };
}

/**
 * Aggregates all purchases + cartones for the email associated with the token.
 */
export function getTalonarioByToken(token: string) {
  const s = store();
  const email = s.tokenToEmail.get(token);
  if (!email) return null;
  const purchases = Array.from(s.purchases.values())
    .filter((p) => p.ownerEmail.toLowerCase() === email)
    .sort((a, b) => b.createdAt - a.createdAt);
  const cartones = Array.from(s.cartones.values())
    .filter((c) => c.ownerEmail.toLowerCase() === email)
    .sort((a, b) => b.createdAt - a.createdAt);
  const ownerName =
    cartones[0]?.ownerName ?? purchases[0]?.ownerName ?? email;
  const totalAmount = purchases.reduce((acc, p) => acc + p.amount, 0);
  return {
    email,
    ownerName,
    totalCartones: cartones.length,
    totalPurchases: purchases.length,
    totalAmount,
    purchases,
    cartones,
  };
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
  if (s.game.status === "paused") {
    return { number: null, state: s.game };
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

export function setGameStatus(
  next: "live" | "paused" | "finished"
): GameState {
  const s = store();
  if (next === "live") {
    if (s.game.status === "idle" || s.game.status === "paused") {
      s.game.status = "live";
      if (!s.game.startedAt) s.game.startedAt = Date.now();
    }
  } else if (next === "paused") {
    if (s.game.status === "live") s.game.status = "paused";
  } else if (next === "finished") {
    s.game.status = "finished";
  }
  return s.game;
}

export function createAdminCartones(input: {
  ownerName: string;
  ownerEmail?: string;
  quantity: number;
  note?: string;
}): Carton[] {
  const s = store();
  const quantity = Math.max(1, Math.min(50, Math.floor(input.quantity)));
  const purchaseId = makeId("adm");
  const ownerEmail = (input.ownerEmail ?? "admin@cigarra.org").toLowerCase();
  const cartones: Carton[] = [];

  for (let i = 0; i < quantity; i++) {
    const id = makeId("crt");
    const carton: Carton = {
      id,
      code: generateCartonCode(),
      ownerName: input.ownerName,
      ownerEmail,
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
    ownerEmail,
    quantity,
    amount: 0,
    currency: "COP",
    status: "paid",
    cartonIds: cartones.map((c) => c.id),
    createdAt: Date.now(),
  };
  s.purchases.set(purchaseId, purchase);
  ensureTokenForEmail(ownerEmail);
  return cartones;
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
