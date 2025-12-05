export function CustomLegend() {
  const items = [
    {
      key: "temperature",
      label: "🌡 Temperatura",
      color: "hsl(var(--chart-1))",
    },
    {
      key: "humidity",
      label: "💧 Umidade",
      color: "hsl(var(--chart-2))",
    },
    {
      key: "windSpeed",
      label: "🌬 Vento",
      color: "hsl(var(--chart-3))",
    },
  ];

  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {items.map((i) => (
        <div key={i.key} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: i.color }}
          ></span>

          <span className="text-[hsl(var(--foreground))]">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
