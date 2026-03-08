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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TrendPoint = {
  timestamp: string;
  pm25: number;
  pm10: number;
};

type NodeTrendChartProps = {
  title: string;
  data: TrendPoint[];
};

// Custom Tailwind Tooltip to replace the ugly default Recharts one
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-2 border-b border-slate-100 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Time: {label}
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <span 
                  className="h-2 w-2 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-semibold uppercase text-slate-700">
                  {entry.name}
                </span>
              </div>
              <span className="font-bold text-slate-900">
                {entry.value} <span className="text-[10px] font-medium text-slate-500">µg/m³</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function NodeTrendChart({ title, data }: NodeTrendChartProps) {
  // Format the time to be cleaner (e.g., "14:30" instead of "2:30:00 PM")
  const formattedData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <Card className="flex h-full flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-900 truncate" title={title}>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-4 pl-0">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              {/* Very subtle horizontal grid lines only */}
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
              
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                dy={10}
                minTickGap={20}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                dx={-10}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} 
              />
              
              {/* PM2.5 - Primary Focus (Bold, Indigo) */}
              <Line 
                type="monotone" 
                name="PM 2.5"
                dataKey="pm25" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} 
              />
              
              {/* PM10 - Secondary Focus (Muted, Slate) */}
              <Line 
                type="monotone" 
                name="PM 10"
                dataKey="pm10" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#94a3b8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}