"use client";

import clsx from "clsx";
import type { Carton } from "@/types/bingo";
import { isMarked } from "@/lib/bingo";

export function CartonGrid({
  carton,
  drawn,
  highlight,
  size = "md",
}: {
  carton: Carton;
  drawn: number[];
  highlight?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const fontSizes = { sm: "text-base", md: "text-xl", lg: "text-2xl" };
  const headerSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-3 sm:p-4 rounded-2xl shadow-xl">
      <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-1 sm:mb-2 text-white font-extrabold">
        {["B", "I", "N", "G", "O"].map((l) => (
          <div
            key={l}
            className={clsx(
              "text-center py-1 sm:py-2 rounded-lg bg-accent-500",
              headerSizes[size]
            )}
          >
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {carton.numbers.flatMap((row, r) =>
          row.map((value, c) => {
            const free = value === null;
            const marked = isMarked(value, drawn);
            const isHi = !free && value === highlight;
            return (
              <div
                key={`${r}-${c}`}
                className={clsx(
                  "cell",
                  free && "free",
                  !free && marked && "marked",
                  fontSizes[size],
                  isHi && "ring-4 ring-accent-300 animate-pop"
                )}
              >
                {free ? <span className="text-lg">★</span> : value}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-primary-50 text-xs">
        <span className="font-mono opacity-90">#{carton.code}</span>
        <span className="opacity-90 truncate ml-2">{carton.ownerName}</span>
      </div>
    </div>
  );
}
