import type { Carton, WinPattern } from "@/types/bingo";

const COLUMN_RANGES: [number, number][] = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
];

function pickN(min: number, max: number, n: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).sort((a, b) => a - b);
}

export function generateCartonNumbers(): (number | null)[][] {
  // 5 columns × 5 rows. Build by column then transpose to rows.
  const cols: (number | null)[][] = COLUMN_RANGES.map(([min, max]) =>
    pickN(min, max, 5)
  );
  // Center FREE
  cols[2][2] = null;
  const rows: (number | null)[][] = [];
  for (let r = 0; r < 5; r++) {
    rows.push([cols[0][r], cols[1][r], cols[2][r], cols[3][r], cols[4][r]]);
  }
  return rows;
}

export function generateCartonCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "0123456789";
  let s = "";
  for (let i = 0; i < 2; i++) s += letters[Math.floor(Math.random() * letters.length)];
  s += "-";
  for (let i = 0; i < 4; i++) s += digits[Math.floor(Math.random() * digits.length)];
  return s;
}

export function isMarked(value: number | null, drawn: number[]): boolean {
  if (value === null) return true; // FREE
  return drawn.includes(value);
}

export function evaluateCarton(
  carton: Carton,
  drawn: number[]
): { won: boolean; pattern: WinPattern | null } {
  const drawnSet = new Set(drawn);
  const grid = carton.numbers;
  const cellMarked = (r: number, c: number) =>
    grid[r][c] === null || drawnSet.has(grid[r][c] as number);

  // 1) Blackout (all 25)
  let allMarked = true;
  for (let r = 0; r < 5 && allMarked; r++) {
    for (let c = 0; c < 5; c++) {
      if (!cellMarked(r, c)) {
        allMarked = false;
        break;
      }
    }
  }
  if (allMarked) return { won: true, pattern: "blackout" };

  // 2) Four corners
  if (
    cellMarked(0, 0) &&
    cellMarked(0, 4) &&
    cellMarked(4, 0) &&
    cellMarked(4, 4)
  ) {
    return { won: true, pattern: "corners" };
  }

  // 3) Diagonals
  const diag1 = [0, 1, 2, 3, 4].every((i) => cellMarked(i, i));
  const diag2 = [0, 1, 2, 3, 4].every((i) => cellMarked(i, 4 - i));
  if (diag1 || diag2) return { won: true, pattern: "diagonal" };

  // 4) Any full row or column
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every((c) => cellMarked(r, c))) {
      return { won: true, pattern: "line" };
    }
  }
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => cellMarked(r, c))) {
      return { won: true, pattern: "line" };
    }
  }

  return { won: false, pattern: null };
}

export function columnLetterFor(n: number): "B" | "I" | "N" | "G" | "O" {
  if (n <= 15) return "B";
  if (n <= 30) return "I";
  if (n <= 45) return "N";
  if (n <= 60) return "G";
  return "O";
}

export function nextRandomNumber(drawn: number[]): number | null {
  const remaining: number[] = [];
  for (let n = 1; n <= 75; n++) if (!drawn.includes(n)) remaining.push(n);
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}
