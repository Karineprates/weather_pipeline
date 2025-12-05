import type { Weather } from "../types/weather";

type CustomTooltipProps = {
  active?: boolean;
  payload?: {
    payload: Weather & { ma?: number };
  }[];
};

// 🔥 Mapeamento dinâmico de ícones por descrição do clima
const weatherIcon = (description: string | undefined) => {
  if (!description) return "❓";

  const desc = description.toLowerCase();

  if (desc.includes("limpo")) return "☀️";
  if (desc.includes("claro")) return "🌤️";
  if (desc.includes("parcial")) return "⛅";
  if (desc.includes("nublado")) return "☁️";
  if (desc.includes("nevoeiro") || desc.includes("neblina")) return "🌫️";
  if (desc.includes("garoa")) return "🌦️";
  if (desc.includes("chuva forte")) return "⛈️";
  if (desc.includes("chuva")) return "🌧️";
  if (desc.includes("trovoada") || desc.includes("tempestade")) return "🌩️";
  if (desc.includes("granizo")) return "⛈️";
  if (desc.includes("neve")) return "❄️";

  return "☁️";
};

export function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const p = payload[0].payload;

  return (
    <div
      className="
        rounded-lg 
        border 
        px-3 
        py-2 
        shadow-xl 
        bg-[hsl(var(--card))] 
        border-[hsl(var(--border))] 
        text-[hsl(var(--card-foreground))]
      "
    >
      {/* Timestamp */}
      {"timestamp" in p && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
          {new Date(p.timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* Ícone + Descrição */}
      {"description" in p && (
        <p className="text-sm text-[hsl(var(--chart-8))] mb-1">
          {weatherIcon(p.description)} <b>{p.description}</b>
        </p>
      )}

      {"temperature" in p && (
        <p className="text-sm text-[hsl(var(--chart-1))]">
          🌡 Temperatura: <b>{p.temperature}°C</b>
        </p>
      )}

      {"apparentTemperature" in p && (
        <p className="text-sm text-[hsl(var(--chart-4))]">
          🤒 Sensação: <b>{p.apparentTemperature}°C</b>
        </p>
      )}

      {"humidity" in p && (
        <p className="text-sm text-[hsl(var(--chart-2))]">
          💧 Umidade: <b>{p.humidity}%</b>
        </p>
      )}

      {"windSpeed" in p && (
        <p className="text-sm text-[hsl(var(--chart-3))]">
          🌬 Vento: <b>{p.windSpeed} km/h</b>
        </p>
      )}

      {"pressure" in p && (
        <p className="text-sm text-[hsl(var(--chart-5))]">
          🧭 Pressão: <b>{p.pressure} hPa</b>
        </p>
      )}

      {"precipitation" in p && (
        <p className="text-sm text-[hsl(var(--chart-6))]">
          🌧 Precipitação: <b>{p.precipitation} mm</b>
        </p>
      )}

      {"visibility" in p && (
        <p className="text-sm text-[hsl(var(--chart-7))]">
          👁 Visibilidade: <b>{p.visibility} m</b>
        </p>
      )}

      {"ma" in p && p.ma !== null && (
        <p className="text-sm text-[hsl(var(--chart-4))]">
          📉 Tendência (MA): <b>{p.ma}°C</b>
        </p>
      )}
    </div>
  );
}