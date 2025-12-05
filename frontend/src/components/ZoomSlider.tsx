import { useState } from "react";

export function ZoomSlider({ max, onChange }: { max: number; onChange: (v: number) => void }) {
  const [value, setValue] = useState(max);

  return (
    <div className="flex flex-col gap-2 w-64">
      <span className="text-sm text-gray-600">Zoom: últimos {value} registros</span>
      <input
        type="range"
        min={10}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          setValue(v);
          onChange(v);
        }}
      />
    </div>
  );
}
