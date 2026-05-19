import clsx from "clsx";
import { columnLetterFor } from "@/lib/bingo";

export function BingoBall({
  n,
  size = 64,
  gold = false,
  className,
}: {
  n: number;
  size?: number;
  gold?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx("bingo-ball", gold && "gold", className)}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      <div className="flex flex-col items-center leading-none">
        <span style={{ fontSize: size * 0.18, opacity: 0.85 }}>
          {columnLetterFor(n)}
        </span>
        <span>{n}</span>
      </div>
    </div>
  );
}
