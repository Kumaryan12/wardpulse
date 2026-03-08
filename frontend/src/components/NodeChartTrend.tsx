"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TrendPoint = {
  timestamp: string;
  pm25: number;
  pm10: number;
};

type NodeTrendChartProps = {
  title: string;
  data: TrendPoint[];
};

export default function NodeTrendChart({ title, data }: NodeTrendChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pm25" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="pm10" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}