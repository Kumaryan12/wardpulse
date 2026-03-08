import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SummaryCardProps = {
  title: string;
  value: string | number;
  trend?: string; // Optional: e.g., "+12% from yesterday"
  status?: "critical" | "warning" | "stable" | "neutral" | "default"; // Optional
};

export default function SummaryCard({ title, value, trend, status }: SummaryCardProps) {
  return (
    <Card>
      {/* We use a flex row here to put the title on the left 
        and the status badge on the right, keeping it compact.
      */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        
        {status && (
          <Badge variant={status} className="capitalize">
            {status}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        
        {trend && (
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}