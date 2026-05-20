export type Column = "B" | "I" | "N" | "G" | "O";
export const COLUMNS: Column[] = ["B", "I", "N", "G", "O"];

/**
 * 5x5 grid. Each cell is a number 1..75 except center (row 2, col 2) which is null (FREE).
 * Column ranges: B 1-15, I 16-30, N 31-45, G 46-60, O 61-75.
 */
export type Carton = {
  id: string;
  code: string;
  ownerName: string;
  ownerEmail: string;
  numbers: (number | null)[][];
  createdAt: number;
  purchaseId: string;
};

export type Purchase = {
  id: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  quantity: number;
  amount: number;
  currency: "COP";
  status: "paid" | "pending";
  cartonIds: string[];
  createdAt: number;
};

export type TalonarioView = {
  email: string;
  ownerName: string;
  totalCartones: number;
  totalPurchases: number;
  totalAmount: number;
  purchases: Purchase[];
  cartones: Carton[];
};

export type GameState = {
  status: "idle" | "live" | "paused" | "finished";
  drawn: number[];
  startedAt: number | null;
  lastDrawAt: number | null;
  winners: Winner[];
};

export type WinPattern =
  | "line"
  | "diagonal"
  | "corners"
  | "blackout";

export type Winner = {
  cartonId: string;
  pattern: WinPattern;
  ownerName: string;
  at: number;
};
