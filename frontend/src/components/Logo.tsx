export function Logo() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10 text-foreground"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo externo */}
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />

      {/* Nuvem */}
      <path
        d="M20 38C20 32 24 28 30 28C31 22 36 18 42 20C48 22 51 28 49 34C54 35 56 40 54 44C52 48 48 50 44 50H26C22 50 20 46 20 42V38Z"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Barras de métricas */}
      <line
        x1="26"
        y1="44"
        x2="26"
        y2="34"
        stroke="hsl(var(--chart-1))"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="44"
        x2="32"
        y2="28"
        stroke="hsl(var(--chart-2))"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="44"
        x2="38"
        y2="36"
        stroke="hsl(var(--chart-3))"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
