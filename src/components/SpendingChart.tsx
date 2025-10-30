import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MonthlyData, getMonthLabel } from '../lib/transactionUtils';

interface SpendingChartProps {
  data: MonthlyData[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  const chartData = data.map((d) => ({
    month: getMonthLabel(d.month),
    Spending: d.totalDebit,
    Income: d.totalCredit,
  })).reverse();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium mb-2">{payload[0].payload.month}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="text-sm text-zinc-300">
              {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-black border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="month"
              stroke="#71717a"
              tick={{ fill: '#71717a' }}
              fontSize={12}
            />
            <YAxis
              stroke="#71717a"
              tick={{ fill: '#71717a' }}
              fontSize={12}
            />
              <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'transparent' }}
              wrapperStyle={{ background: 'transparent', border: 'none' }}
              />
            <Legend wrapperStyle={{ color: '#a1a1aa' }} />
            <Bar dataKey="Spending" fill="#ffffff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Income" fill="#71717a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
