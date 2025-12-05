import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../lib/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceDot,
  Area,
} from "recharts";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";

import { DateRangePicker } from "@/components/DateRangePicker";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CustomTooltip } from "@/components/CustomTooltip";
import { ComboChart } from "@/components/ComboChart";
import { ZoomSlider } from "@/components/ZoomSlider";

import type { Weather } from "../types/weather";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";

// 🔥 TIPO DO INSIGHT
type InsightCard = {
  title: string;
  status: string;
  description: string;
  severity: "info" | "warning" | "critical" | "positive";
};

type WeatherInsights = {
  avgTemp: number;
  avgHumidity: number;
  avgWind: number;
  comfortScore: number;
  trend: number;
  summary: string;
  headline?: string;
  cards?: InsightCard[];
  recommendations?: string[];
  alerts?: string[];
  message?: string;
};

const normalizeWeather = (item: Partial<Weather>): Weather => ({
  _id: String(
    item._id ?? (item as { id?: string }).id ?? Math.random().toString(36).slice(2),
  ),
  temperature: Number(item.temperature ?? 0),
  apparentTemperature: Number(
    item.apparentTemperature ?? item.temperature ?? 0,
  ),
  humidity: Number(item.humidity ?? 0),
  windSpeed: Number(item.windSpeed ?? 0),
  pressure: Number(item.pressure ?? 0),
  precipitation: Number(item.precipitation ?? 0),
  visibility: Number(item.visibility ?? 0),
  description: item.description ?? "Sem descrição",
  city: item.city ?? "N/A",
  timestamp: item.timestamp ?? new Date().toISOString(),
});

const formatNumber = (value: unknown, fractionDigits = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return num.toFixed(fractionDigits);
};

const accentTones = ["tone-blue", "tone-emerald", "tone-amber", "tone-slate"];

function movingAverage(data: Weather[], key: keyof Weather, period = 7) {
  return data.map((_, idx) => {
    if (idx < period) return { ma: null };
    const slice = data.slice(idx - period, idx);
    const avg = slice.reduce((s, item) => s + Number(item[key]), 0) / period;
    return { ma: Number(avg.toFixed(2)) };
  });
}

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [data, setData] = useState<Weather[]>([]);
  const [loading, setLoading] = useState(true);

  const [insights, setInsights] = useState<WeatherInsights | null>(null);

  const [range, setRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const [zoom, setZoom] = useState(100);

  const observationHours = 72;

    const chartColors = useMemo(
    () => ({
      axis: "var(--chart-axis-color, hsl(var(--muted-foreground)))",
      grid: "var(--chart-grid-color, hsl(var(--border)))",
      temperature: "var(--chart-temperature-color, hsl(var(--chart-1)))",
      trend: "var(--chart-trend-color, hsl(var(--chart-4)))",
    }),
    []
  );

  const badgeToneClass = (severity: InsightCard["severity"]) => {
    switch (severity) {
      case "critical":
        return "chip-critical";
      case "warning":
        return "chip-warning";
      case "positive":
        return "chip-positive";
      default:
        return "chip-info";
    }
  };

  const conditionTone = (description: string) => {
    const normalized = description.toLowerCase();

    if (normalized.includes("chuva") || normalized.includes("rain")) {
      return "condition-rain";
    }

    if (normalized.includes("sol") || normalized.includes("sun")) {
      return "condition-sun";
    }

    if (normalized.includes("nublado") || normalized.includes("cloud")) {
      return "condition-cloudy";
    }

    return "condition-default";
  };

  // CARREGA DADOS DE CLIMA
  const loadData = useCallback(async () => {
    setLoading(true);

    const params: Record<string, string | number | undefined> = { limit: 500 };
    if (range?.from) params.from = range.from.toISOString();
    if (range?.to) params.to = range.to.toISOString();

    try {
      const res = await api.get("/weather", { params });
      setData(res.data.items.map(normalizeWeather));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.
          message ?? "Não foi possível carregar os dados de clima.";
      setData([]);
      console.error(message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  // CARREGA INSIGHTS
  const loadInsights = useCallback(
    async () => {
      const params: Record<string, string> = {};
      if (range?.from) params.from = range.from.toISOString();
      if (range?.to) params.to = range.to.toISOString();

      const res = await api.get("/weather/insights", { params });
      setInsights(res.data);
    },
    [range]
  );

  const handleExport = useCallback(
    async (format: "csv" | "xlsx") => {
      const params = new URLSearchParams();
      if (range?.from) params.append("from", range.from.toISOString());
      if (range?.to) params.append("to", range.to.toISOString());

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.defaults.baseURL}/weather/export/${format}?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `weather.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    [range]
  );

  // CARREGA AMBOS AO INICIAR
  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadData(), loadInsights()]);
    };

    void bootstrap();
  }, [loadData, loadInsights]);

  // ORDENAÇÃO
  const ordered = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [data]
  );

  // FORMATADO PRO GRÁFICO
  const formatted = useMemo(() => {
    if (!ordered.length) return [];

    const maxZoom = Math.min(zoom, ordered.length);
    const subset = ordered.slice(-maxZoom);

    const ma = movingAverage(subset, "temperature");

    return subset.map((w, i) => ({
      ...w,
      time: new Date(w.timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ma: ma[i]?.ma ?? null,
    }));
  }, [ordered, zoom]);

    const trendSnapshot = useMemo(() => {
    if (formatted.length < 2) return null;

    const temperatures = formatted.map((item) => item.temperature);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg =
      temperatures.reduce((acc, value) => acc + value, 0) / temperatures.length;

    const firstPoint = formatted[0];
    const lastPoint = formatted[formatted.length - 1];
    const delta = lastPoint.temperature - firstPoint.temperature;
    const direction = delta > 0 ? "alta" : delta < 0 ? "queda" : "estável";
    const percentage =
      firstPoint.temperature !== 0
        ? (delta / firstPoint.temperature) * 100
        : 0;

    return {
      min,
      max,
      avg,
      start: firstPoint.temperature,
      end: lastPoint.temperature,
      delta,
      direction,
      percentage,
      firstLabel: firstPoint.time,
      lastLabel: lastPoint.time,
    };
  }, [formatted]);

  const stats = useMemo(() => {
    if (!ordered.length) return null;

    const temperatures = ordered.map((item) => item.temperature);
    const humidities = ordered.map((item) => item.humidity);
    const winds = ordered.map((item) => item.windSpeed);
    const lastEntry = ordered[ordered.length - 1];

    return {
      maxTemp: Math.max(...temperatures),
      minTemp: Math.min(...temperatures),
      avgPressure:
        ordered.reduce((acc, item) => acc + (item.pressure ?? 0), 0) /
        ordered.length,
      maxHumidity: Math.max(...humidities),
      minHumidity: Math.min(...humidities),
      topWind: Math.max(...winds),
      accumulatedRain: Number(lastEntry?.precipitation ?? 0),
    };
  }, [ordered]);

  if (loading && data.length === 0) {
    return (
      <AppShell userEmail={user?.email} onLogout={logout}>
        <Skeleton className="h-24 w-full bg-muted" />
      </AppShell>
    );
  }

  const last = ordered[ordered.length - 1];
  const first = ordered[0];

  return (
    <AppShell userEmail={user?.email} userRole={user?.role} onLogout={logout}>
      <div className="relative mb-8 overflow-hidden rounded-3xl border bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6 shadow-sm dark:from-slate-900 dark:via-slate-950 dark:to-emerald-900/20">
        <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-10 left-4 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-sky-700 dark:text-sky-200">Monitoramento climático</p>
            <h1 className="text-3xl font-bold leading-tight">Dashboard meteorológico</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Acompanhe as últimas leituras coletadas automaticamente e gere insights rápidos para tomar decisões.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {last?.city && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur dark:bg-white/10">
                  📍 {last.city}
                </span>
              )}
              {first && last && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur dark:bg-white/10">
                  ⏱️ Dados de {new Date(first.timestamp).toLocaleDateString("pt-BR")} até {new Date(last.timestamp).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>

            <div className="relative flex flex-col gap-3 rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-slate-900/60">
            <p className="text-xs uppercase text-muted-foreground">Temperatura atual</p>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-semibold leading-none">{last ? `${formatNumber(last.temperature)}°C` : "--"}</p>
              {insights?.trend !== undefined && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100">
                  {insights.trend > 0 ? "Tendência de alta" : insights.trend < 0 ? "Tendência de queda" : "Estável"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Sensação térmica: {last ? `${formatNumber(last.apparentTemperature)}°C` : "--"}</p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <DateRangePicker value={range} onChange={setRange} />

        <Button
          onClick={async () => {
            await loadData();
            await loadInsights();
          }}
        >
          {loading ? "Carregando..." : "Filtrar"}
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            setRange({ from: undefined, to: undefined });
            void (async () => {
              await loadData();
              await loadInsights();
            })();
          }}
        >
          Limpar
        </Button>

        {ordered.length > 0 && (
          <div className="ml-auto flex flex-1 items-center justify-end gap-6">
            <ZoomSlider max={Math.max(10, ordered.length)} onChange={setZoom} />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("csv")}>
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("xlsx")}>
                Exportar XLSX
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CARDS PRINCIPAIS */}
      {last && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[{
            label: "Temperatura",
            value: `${formatNumber(last.temperature)}°C`,
            note: "Atual",
            tone: "tone-blue",
          },
          {
            label: "Umidade",
            value: `${formatNumber(last.humidity, 0)}%`,
            note: "Última leitura",
            tone: "tone-emerald",
          },
          {
            label: "Vento",
            value: `${formatNumber(last.windSpeed)} km/h`,
            note: "Rajada mais recente",
            tone: "tone-amber",
          },
          {
            label: "Condição",
            value: last.description,
            note: "Resumo",
            tone: "tone-slate",
          }].map((card) => (
            <div key={card.label} className={`metric-card ${card.tone}`}>
              <p className="text-sm font-medium">{card.label}</p>
              <p className="text-3xl font-bold leading-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.note}</p>
            </div>
          ))}
        </div>
      )}

      {/* INDICADORES AVANÇADOS */}
      {stats && (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Indicadores rápidos</span>
              <span className="text-xs font-medium text-muted-foreground">Atualizado em {last ? new Date(last.timestamp).toLocaleString("pt-BR") : "--"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { label: "Máxima recente", value: `${formatNumber(stats.maxTemp)}°C`, helper: "Pico de temperatura observado" },
                { label: "Mínima recente", value: `${formatNumber(stats.minTemp)}°C`, helper: "Madrugada mais fria" },
                { label: "Umidade extrema", value: `${formatNumber(stats.maxHumidity, 0)}%`, helper: "Maior índice registrado" },
                { label: "Umidade mínima", value: `${formatNumber(stats.minHumidity, 0)}%`, helper: "Mais seco do período" },
                { label: "Vento máximo", value: `${formatNumber(stats.topWind)} km/h`, helper: "Rajada mais forte" },
                { label: "Chuva acumulada", value: `${formatNumber(stats.accumulatedRain)} mm`, helper: "Volume total coletado" },
                { label: "Pressão média", value: `${formatNumber(stats.avgPressure, 0)} hPa`, helper: "Constância barométrica" },
                ].map((item, idx) => (
                  <div key={item.label} className={`metric-card ${accentTones[idx % accentTones.length]}`}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-semibold leading-tight">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.helper}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* INSIGHT COM IA */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Insight Climático (IA)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {!insights ? (
            <p>Carregando insights...</p>
          ) : insights.message ? (
            <p>{insights.message}</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4 text-sm">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">Tempo de observação</p>
                  <p className="text-lg font-semibold">Últimos {observationHours / 24} dias</p>
                  <p className="text-xs text-muted-foreground">{ordered.length} registros coletados</p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">Temperatura média</p>
                  <p className="text-lg font-semibold">{formatNumber(insights.avgTemp)}°C</p>
                  <p className="text-xs text-muted-foreground">(dias calculados)</p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">Umidade média</p>
                  <p className="text-lg font-semibold">{formatNumber(insights.avgHumidity, 0)}%</p>
                  <p className="text-xs text-muted-foreground">(dias calculados)</p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">Vento médio</p>
                  <p className="text-lg font-semibold">{formatNumber(insights.avgWind, 0)} km/h</p>
                  <p className="text-xs text-muted-foreground">(dias calculados)</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold">{insights.summary}</p>
                {insights.headline && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insights.headline}
                  </p>
                )}
              </div>

              {insights.cards && insights.cards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {insights.cards.map((card) => (
                    <div
                      key={`${card.title}-${card.status}`}
                      className="rounded-md border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {card.title}
                        </p>
                        <Badge className={badgeToneClass(card.severity)} variant="outline">
                          {card.status}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="font-semibold">Tendência</p>
                  <p className="text-muted-foreground">
                    {insights.trend > 0
                      ? "📈 Subindo"
                      : insights.trend < 0
                        ? "📉 Caindo"
                        : "➖ Estável"}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="font-semibold">Conforto climático</p>
                  <p className="text-muted-foreground">{insights.comfortScore}/100</p>
                </div>
              </div>

              {insights.recommendations && insights.recommendations.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="font-semibold mb-1">Sugestões práticas</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                    {insights.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.alerts && insights.alerts.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {insights.alerts.map((alert) => (
                    <span key={alert} className="rounded-full bg-destructive/10 text-destructive px-3 py-1">
                      {alert}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRÁFICO COMBO */}
      {formatted.length > 0 && (
        <Card className="mb-10">
          <CardHeader><CardTitle>Temperatura • Umidade • Vento</CardTitle></CardHeader>
          <CardContent>
            <ComboChart data={formatted} />
          </CardContent>
        </Card>
      )}

      {/* GRÁFICO DE TEMPERATURA */}
      {formatted.length > 0 && (
        <Card className="mb-10">
 <CardHeader>
    <CardTitle>Tendência da Temperatura</CardTitle>
  </CardHeader>

  <CardContent className="temperature-chart space-y-4">

    {/* CHIP DE INDICADORES */}
    {trendSnapshot && (
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
          🌡️ Início: <strong>{formatNumber(trendSnapshot.start)}°C</strong>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
          🎯 Último ponto: <strong>{formatNumber(trendSnapshot.end)}°C</strong>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
          {trendSnapshot.delta > 0 ? "📈" : trendSnapshot.delta < 0 ? "📉" : "➖"}
          Variação: {trendSnapshot.delta > 0 ? "+" : ""}
          {formatNumber(trendSnapshot.delta)}°C ({formatNumber(trendSnapshot.percentage)}%)
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
          📊 Faixa: {formatNumber(trendSnapshot.min)}°C – {formatNumber(trendSnapshot.max)}°C
        </span>
      </div>
    )}

    {/* GRÁFICO */}
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>

        {/* GRADIENTES */}
        <defs>
          <linearGradient id="tempStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={chartColors.temperature} stopOpacity={1} />
            <stop offset="100%" stopColor={chartColors.temperature} stopOpacity={0.8} />
          </linearGradient>

          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.temperature} stopOpacity={0.15} />
            <stop offset="95%" stopColor={chartColors.temperature} stopOpacity={0} />
          </linearGradient>

          <linearGradient id="tempGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.temperature} stopOpacity={0.35} />
            <stop offset="100%" stopColor={chartColors.temperature} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* GRADE */}
        <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" />

        {/* EIXO X */}
        <XAxis
          dataKey="time"
          stroke={chartColors.axis}
          tick={{ fill: chartColors.axis, fontSize: 12 }}
          minTickGap={25}
        />

        {/* EIXO Y — FIX PRINCIPAL */}
        <YAxis
          stroke={chartColors.axis}
          tick={{ fill: chartColors.axis, fontSize: 12 }}
          tickFormatter={(v) => `${formatNumber(v)}°C`}
          domain={["dataMin - 1", "dataMax + 1"]}
        />

        {/* TOOLTIP */}
        <Tooltip content={<CustomTooltip />} />

        {/* LEGENDA */}
        <Legend verticalAlign="top" align="right" iconType="circle" iconSize={10} />

        {/* LINHA DE MÉDIA */}
        {trendSnapshot?.avg && (
          <ReferenceLine
            y={trendSnapshot.avg}
            ifOverflow="extendDomain"
            stroke={chartColors.grid}
            strokeDasharray="3 3"
            label={{
              value: `Média ${formatNumber(trendSnapshot.avg)}°C`,
              position: "right",
              fill: chartColors.axis,
              fontSize: 11,
            }}
          />
        )}

        {/* PONTO INICIAL */}
        {trendSnapshot && formatted.length > 0 && (
          <ReferenceDot
            x={formatted[0]?.time}
            y={trendSnapshot.start}
            r={4}
            fill={chartColors.temperature}
            stroke="hsl(var(--card))"
            strokeWidth={1.2}
            label={{ value: "Início", position: "top", fontSize: 11 }}
          />
        )}

        {/* PONTO FINAL */}
        {trendSnapshot && formatted.length > 1 && (
          <ReferenceDot
            x={formatted[formatted.length - 1]?.time}
            y={trendSnapshot.end}
            r={5}
            fill={chartColors.trend}
            stroke="hsl(var(--card))"
            strokeWidth={1.2}
            label={{
              value:
                trendSnapshot.direction === "estável"
                  ? "Estável"
                  : trendSnapshot.direction === "alta"
                    ? "Alta"
                    : "Queda",
              position: "top",
              fontSize: 11,
            }}
          />
        )}

        {/* ÁREA (não aparece na legenda) */}
        <Area
          type="monotone"
          dataKey="temperature"
          stroke="none"
          fill="url(#tempFill)"
          legendType="none"
        />

        {/* LINHA PRINCIPAL */}
        <Line
          type="monotone"
          dataKey="temperature"
          name="Temperatura"
          stroke="url(#tempStroke)"
          strokeWidth={3}
          connectNulls={true}
          dot={{
            r: 3,
            stroke: "hsl(var(--card))",
            strokeWidth: 1.2,
            fill: chartColors.temperature,
          }}
          activeDot={{ r: 5, fill: "url(#tempGlow)" }}
        />

        {/* MÉDIA MÓVEL */}
        <Line
          type="monotone"
          dataKey="ma"
          name="Média móvel"
          stroke={chartColors.trend}
          strokeDasharray="6 6"
          strokeWidth={2}
          dot={false}
        />

      </LineChart>
    </ResponsiveContainer>
  </CardContent>
        </Card>
      )}

      {/* TABELA DE LOGS (Requisito do desafio) */}
      <Card className="mb-20">
        <CardHeader>
          <CardTitle>Registros Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/30 text-sm text-muted-foreground">
                <tr className="border-b">
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium">Temperatura</th>
                  <th className="p-3 font-medium">Umidade</th>
                  <th className="p-3 font-medium">Vento</th>
                  <th className="p-3 font-medium">Chuva</th>
                  <th className="p-3 font-medium">Condição</th>
                </tr>
              </thead>
              <tbody>
                {ordered.slice(-30).map((row) => (
                  <tr key={row._id} className="border-b transition hover:bg-muted/50">
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(row.timestamp).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 font-semibold">{`${formatNumber(row.temperature)}°C`}</td>
                    <td className="p-3">{`${formatNumber(row.humidity, 0)}%`}</td>
                    <td className="p-3">{`${formatNumber(row.windSpeed)} km/h`}</td>
                    <td className="p-3">{`${formatNumber(row.precipitation)} mm`}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${conditionTone(row.description)}`}>
                        {row.description}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
