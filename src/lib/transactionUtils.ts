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
  amount: number; // Net spending (spending - reimbursements)
  spending: number; // Total debit amount
  reimbursements: number; // Total reimbursements
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
  
  // Calculate total reimbursements per month (credits marked as reimbursements)
  const reimbursementsByMonth = new Map<string, number>();
  transactions
    .filter(t => t.type === 'Credit' && t.is_reimbursement)
    .forEach(t => {
      const monthKey = getMonthKey(t.date);
      const existing = reimbursementsByMonth.get(monthKey) || 0;
      reimbursementsByMonth.set(monthKey, existing + Number(t.amount));
    });

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
      // Add debit amount (reimbursements will be subtracted at the end)
      monthData.totalDebit += Number(t.amount);
    } else {
      // Only count credit as income if it's NOT a reimbursement
      if (!t.is_reimbursement) {
        monthData.totalCredit += Number(t.amount);
      }
    }
    monthData.transactionCount += 1;
  });

  // Subtract reimbursements from spending for each month
  monthsMap.forEach((monthData, monthKey) => {
    const reimbursementAmount = reimbursementsByMonth.get(monthKey) || 0;
    monthData.totalDebit -= reimbursementAmount;
    monthData.netAmount = monthData.totalCredit - monthData.totalDebit;
  });

  return Array.from(monthsMap.values()).sort((a, b) =>
    b.month.localeCompare(a.month)
  );
};

export const calculateCategoryBreakdown = (
  transactions: Transaction[]
): CategoryData[] => {
  const categoryMap = new Map<string, { spending: number; count: number }>();
  
  // Calculate reimbursements by category (use the reimbursement's category field)
  const reimbursementsByCategory = new Map<string, number>();
  transactions
    .filter(t => t.type === 'Credit' && t.is_reimbursement)
    .forEach(t => {
      const existing = reimbursementsByCategory.get(t.category) || 0;
      reimbursementsByCategory.set(t.category, existing + Number(t.amount));
    });

  let totalNetAmount = 0;

  // Calculate spending by category
  transactions
    .filter(t => t.type === 'Debit')
    .forEach(t => {
      const amount = Number(t.amount);

      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, { spending: 0, count: 0 });
      }

      const cat = categoryMap.get(t.category)!;
      cat.spending += amount;
      cat.count += 1;
    });

  // Calculate net amounts (spending - reimbursements) and total
  const categoryData = Array.from(categoryMap.entries()).map(([category, data]) => {
    const reimbursements = reimbursementsByCategory.get(category) || 0;
    const spending = data.spending; // Original spending (debits)
    const netAmount = Math.max(0, spending - reimbursements); // Net after reimbursements
    
    return {
      category,
      spending,
      reimbursements,
      netAmount,
      count: data.count,
    };
  });

  // Calculate total net amount for percentage calculation
  totalNetAmount = categoryData.reduce((sum, cat) => sum + cat.netAmount, 0);

  return categoryData
    .map((data) => ({
      category: data.category,
      amount: data.netAmount, // Net spending for display (main card value)
      spending: data.spending, // Total debit amount
      reimbursements: data.reimbursements, // Total reimbursements
      count: data.count,
      percentage: totalNetAmount > 0 ? (data.netAmount / totalNetAmount) * 100 : 0,
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
  
  // Track reimbursements by date
  const reimbursementsByDate = new Map<string, number>();
  transactions
    .filter(t => t.type === 'Credit' && t.is_reimbursement)
    .forEach(t => {
      const dateKey = t.date;
      const existing = reimbursementsByDate.get(dateKey) || 0;
      reimbursementsByDate.set(dateKey, existing + Number(t.amount));
    });

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
      // Only count credit as income if it's NOT a reimbursement
      if (!t.is_reimbursement) {
        dayData.totalCredit += Number(t.amount);
      }
    }
  });

  // Subtract reimbursements from spending for each day
  dailyMap.forEach((dayData, dateKey) => {
    const reimbursementAmount = reimbursementsByDate.get(dateKey) || 0;
    dayData.totalDebit -= reimbursementAmount;
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
