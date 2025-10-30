import { Transaction } from './supabase';
import { format, parseISO } from 'date-fns';

export interface MonthlyData {
  month: string;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
  transactionCount: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export const getMonthKey = (date: string): string => {
  return format(parseISO(date), 'yyyy-MM');
};

export const getMonthLabel = (monthKey: string): string => {
  return format(parseISO(`${monthKey}-01`), 'MMM yyyy');
};

export const groupTransactionsByMonth = (transactions: Transaction[]): string[] => {
  const months = new Set<string>();
  transactions.forEach(t => {
    months.add(getMonthKey(t.date));
  });
  return Array.from(months).sort().reverse();
};

export const filterTransactionsByMonth = (
  transactions: Transaction[],
  monthKey: string
): Transaction[] => {
  return transactions.filter(t => getMonthKey(t.date) === monthKey);
};

export const calculateMonthlyStats = (
  transactions: Transaction[]
): MonthlyData[] => {
  const monthsMap = new Map<string, MonthlyData>();

  transactions.forEach(t => {
    const monthKey = getMonthKey(t.date);
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        month: monthKey,
        totalDebit: 0,
        totalCredit: 0,
        netAmount: 0,
        transactionCount: 0,
      });
    }

    const monthData = monthsMap.get(monthKey)!;
    if (t.type === 'Debit') {
      monthData.totalDebit += Number(t.amount);
    } else {
      monthData.totalCredit += Number(t.amount);
    }
    monthData.netAmount = monthData.totalCredit - monthData.totalDebit;
    monthData.transactionCount += 1;
  });

  return Array.from(monthsMap.values()).sort((a, b) =>
    b.month.localeCompare(a.month)
  );
};

export const calculateCategoryBreakdown = (
  transactions: Transaction[]
): CategoryData[] => {
  const categoryMap = new Map<string, { amount: number; count: number }>();
  let totalAmount = 0;

  transactions
    .filter(t => t.type === 'Debit')
    .forEach(t => {
      const amount = Number(t.amount);
      totalAmount += amount;

      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, { amount: 0, count: 0 });
      }

      const cat = categoryMap.get(t.category)!;
      cat.amount += amount;
      cat.count += 1;
    });

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: (data.amount / totalAmount) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export interface DailyData {
  date: string;
  totalDebit: number;
  totalCredit: number;
}

export const calculateDailyStats = (
  transactions: Transaction[]
): DailyData[] => {
  const dailyMap = new Map<string, DailyData>();

  transactions.forEach(t => {
    const dateKey = t.date;
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        totalDebit: 0,
        totalCredit: 0,
      });
    }

    const dayData = dailyMap.get(dateKey)!;
    if (t.type === 'Debit') {
      dayData.totalDebit += Number(t.amount);
    } else {
      dayData.totalCredit += Number(t.amount);
    }
  });

  return Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
