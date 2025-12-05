import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

type ForecastItem = {
  date: string;
  description: string;
  maxTemp: number | null;
  minTemp: number | null;
  rainChance: number | null;
  windMax: number | null;
};

type ForecastDetail = {
  date: string;
  hours: {
    time: string;
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    description: string;
  }[];
};

export default function Explore() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(7);
  const [selected, setSelected] = useState<ForecastDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState<string | undefined>(undefined);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/external/forecast", { params: { page, limit, city } })
      .then((res) => {
        setItems(res.data.items);
        setTotal(res.data.total ?? 0);
        setLimit(res.data.limit ?? limit);
        const loc = res.data.location;
        if (loc?.name) {
          setLocationLabel(`${loc.name} (GMT ${loc.timezone ?? "auto"})`);
        } else if (loc?.latitude && loc?.longitude) {
          setLocationLabel(`Lat ${loc.latitude.toFixed(2)}, Lon ${loc.longitude.toFixed(2)}`);
        } else {
          setLocationLabel(null);
        }
        setError(null);
      })
      .catch((err) => {
        setItems([]);
        setTotal(0);
        setLocationLabel(null);
        setError(err.response?.data?.message ?? "Não foi possível carregar as previsões.");
      })
      .finally(() => setLoading(false));
  }, [page, city, limit]);

  async function loadDetail(date: string) {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/external/forecast/${date}`, { params: { city } });
      setSelected(res.data);
    } finally {
      setLoadingDetail(false);
    }
  }

  function applyCitySearch() {
    const trimmed = cityInput.trim();
    setPage(1);
    setCity(trimmed.length ? trimmed : undefined);
  }

  return (
    <AppShell userEmail={user?.email} userRole={user?.role} onLogout={logout}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-semibold">Explorar previsões</h1>
            <p className="text-sm text-muted-foreground">Próximos dias via Open-Meteo, com paginação e detalhe horário.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar cidade (ex: São Paulo)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-64"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCitySearch();
                }
              }}
            />
            <Button onClick={applyCitySearch}>Buscar</Button>
            {city && (
              <Button variant="ghost" onClick={() => { setCity(undefined); setCityInput(""); }}>
                Limpar
              </Button>
            )}
            {locationLabel && <span className="text-sm text-muted-foreground">{locationLabel}</span>}
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próxima
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card
              key={item.date}
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => loadDetail(item.date)}
            >
              <CardHeader>
                <CardTitle className="space-y-1">
                  <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString("pt-BR")}</p>
                  <p className="text-lg font-semibold leading-tight">{item.description}</p>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>
                  🌡️ Máx: <span className="font-semibold text-foreground">{item.maxTemp ?? "--"}°C</span>
                </p>
                <p>
                  🧊 Mín: <span className="font-semibold text-foreground">{item.minTemp ?? "--"}°C</span>
                </p>
                <p>
                  🌧️ Chuva: <span className="font-semibold text-foreground">{item.rainChance ?? 0}%</span>
                </p>
                <p>
                  💨 Vento: <span className="font-semibold text-foreground">{item.windMax ?? 0} km/h</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="capitalize flex items-center justify-between gap-2">
              <span>Detalhes do dia {new Date(selected.date).toLocaleDateString("pt-BR")}</span>
              {loadingDetail && <span className="text-xs text-muted-foreground">Atualizando...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30 text-sm text-muted-foreground">
                  <tr className="border-b">
                    <th className="p-3 font-medium">Hora</th>
                    <th className="p-3 font-medium">Temperatura</th>
                    <th className="p-3 font-medium">Umidade</th>
                    <th className="p-3 font-medium">Vento</th>
                    <th className="p-3 font-medium">Condição</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.hours.map((row) => (
                    <tr key={row.time} className="border-b">
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(row.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-3">{row.temperature ?? "--"}°C</td>
                      <td className="p-3">{row.humidity ?? "--"}%</td>
                      <td className="p-3">{row.windSpeed ?? "--"} km/h</td>
                      <td className="p-3 text-sm text-muted-foreground">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
