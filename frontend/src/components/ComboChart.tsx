import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { CustomTooltip } from "./CustomTooltip";
import { CustomLegend } from "./CustomLegend";

type ComboChartDatum = {
  time: string;
  humidity: number;
  temperature: number;
  windSpeed: number;
  ma?: number | null;
};

export function ComboChart({ data }: { data: ComboChartDatum[] }) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />

          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />

          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Bar
            dataKey="humidity"
            barSize={18}
            fill="hsl(var(--chart-2))"
          />

          <Line
            type="monotone"
            dataKey="temperature"
            stroke="hsl(var(--chart-1))"
            strokeWidth={3}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="windSpeed"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 👇 AQUI AGORA FUNCIONA */}
      <CustomLegend />
    </div>
  );
}