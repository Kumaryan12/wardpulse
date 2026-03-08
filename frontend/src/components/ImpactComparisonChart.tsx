"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ImpactComparisonChartProps = {
  before_pm25_avg: number;
  after_pm25_avg: number;
  before_pm10_avg: number;
  after_pm10_avg: number;
};

export default function ImpactComparisonChart({
  before_pm25_avg,
  after_pm25_avg,
  before_pm10_avg,
  after_pm10_avg,
}: ImpactComparisonChartProps) {
  const data = [
    {
      metric: "PM2.5",
      Before: before_pm25_avg,
      After: after_pm25_avg,
    },
    {
      metric: "PM10",
      Before: before_pm10_avg,
      After: after_pm10_avg,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Before vs After Impact</h3>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Before" />
            <Bar dataKey="After" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}