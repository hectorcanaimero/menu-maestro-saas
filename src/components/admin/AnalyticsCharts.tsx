import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartDataPoint } from '@/lib/analytics';
import { formatCurrency } from '@/lib/analytics';

interface AnalyticsChartsProps {
  data: ChartDataPoint[];
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const RevenueTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{payload[0]?.payload?.date}</p>
          <p className="text-sm text-primary">
            Ingresos: {formatCurrency(payload[0]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  const OrdersTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{payload[0]?.payload?.date}</p>
          <p className="text-sm text-muted-foreground">
            Pedidos: {payload[0]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
                name="Ingresos"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<OrdersTooltip />} />
              <Legend />
              <Bar
                dataKey="orders"
                fill="hsl(var(--secondary))"
                radius={[8, 8, 0, 0]}
                name="Pedidos"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
