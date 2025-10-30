import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DailyData } from '../lib/transactionUtils';
import { format, parseISO } from 'date-fns';

interface DailySpendingChartProps {
  data: DailyData[];
}

export function DailySpendingChart({ data }: DailySpendingChartProps) {
  const chartData = data.map((d) => ({
    date: format(parseISO(d.date), 'dd MMM'),
    fullDate: format(parseISO(d.date), 'dd MMM yyyy'),
    Spending: d.totalDebit,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium mb-2">{payload[0].payload.fullDate}</p>
          <p className="text-sm text-zinc-300">
            Spending: ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-black border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Daily Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              tick={{ fill: '#71717a' }}
              fontSize={12}
            />
            <YAxis
              stroke="#71717a"
              tick={{ fill: '#71717a' }}
              fontSize={12}
            />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b' }} />
            <Legend wrapperStyle={{ color: '#a1a1aa' }} />
            <Line
              type="monotone"
              dataKey="Spending"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ fill: '#ffffff', r: 3 }}
              activeDot={{ r: 5 }}
            />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
