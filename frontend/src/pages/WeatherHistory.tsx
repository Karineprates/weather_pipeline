import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

type Weather = {
  _id: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  city: string;
  timestamp: string;
};

export default function WeatherHistory() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Weather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/weather?limit=50&page=1")
      .then((res) => setItems(res.data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <AppShell userEmail={user?.email} userRole={user?.role} onLogout={logout}>
        <p>Carregando histórico...</p>
      </AppShell>
    );

  return (
    <AppShell userEmail={user?.email} userRole={user?.role} onLogout={logout}>
      <h1 className="text-2xl font-semibold mb-4">Histórico do Clima</h1>

      <Card className="p-4 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Cidade</th>
              <th className="p-2">Temp</th>
              <th className="p-2">Umidade</th>
              <th className="p-2">Vento</th>
              <th className="p-2">Descrição</th>
              <th className="p-2">Data</th>
            </tr>
          </thead>

          <tbody>
            {items.map((w) => (
              <tr key={w._id} className="border-b hover:bg-muted/30">
                <td className="p-2">{w.city}</td>
                <td className="p-2">{w.temperature}°C</td>
                <td className="p-2">{w.humidity}%</td>
                <td className="p-2">{w.windSpeed} km/h</td>
                <td className="p-2">{w.description}</td>
                <td className="p-2">
                  {new Date(w.timestamp).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
