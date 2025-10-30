import { Card, CardContent } from './ui/card';
import { CategoryData, formatCurrency } from '../lib/transactionUtils';
import { ChevronRight } from 'lucide-react';

interface CategoryCardProps {
  data: CategoryData;
  onClick: () => void;
}

export function CategoryCard({ data, onClick }: CategoryCardProps) {
  return (
    <Card
      className="bg-black border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white">{data.category}</h3>
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(data.amount)}
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span>{data.count} transactions</span>
              <span>{data.percentage.toFixed(1)}% of spending</span>
            </div>
            <div className="mt-3 w-full bg-zinc-900 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(data.percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
