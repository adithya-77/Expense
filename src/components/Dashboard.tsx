import { useState, useEffect } from 'react';
import { supabase, Transaction } from '../lib/supabase';
import {
  calculateMonthlyStats,
  calculateCategoryBreakdown,
  calculateDailyStats,
  filterTransactionsByMonth,
  groupTransactionsByMonth,
  getMonthLabel,
  formatCurrency,
} from '../lib/transactionUtils';
import { StatCard } from './StatCard';
import { CategoryCard } from './CategoryCard';
import { SpendingChart } from './SpendingChart';
import { DailySpendingChart } from './DailySpendingChart';
import { TransactionTable } from './TransactionTable';
import { CategoryDetailDialog } from './CategoryDetailDialog';
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CreditsManagement } from './CreditsManagement';

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableMonths = groupTransactionsByMonth(transactions);
  const filteredTransactions =
    selectedMonth === 'all'
      ? transactions
      : filterTransactionsByMonth(transactions, selectedMonth);

  const monthlyStatsAll = calculateMonthlyStats(transactions);
  const monthlyStatsFiltered = calculateMonthlyStats(filteredTransactions);
  const dailyStats = calculateDailyStats(filteredTransactions);
  const categoryBreakdown = calculateCategoryBreakdown(filteredTransactions);
  
  const zeroMonth = {
    totalDebit: 0,
    totalCredit: 0,
    netAmount: 0,
    transactionCount: 0,
  };

  const allTimeData = monthlyStatsAll.reduce(
    (acc, m) => ({
      totalDebit: acc.totalDebit + m.totalDebit,
      totalCredit: acc.totalCredit + m.totalCredit,
      netAmount: acc.netAmount + (m.totalCredit - m.totalDebit),
      transactionCount: acc.transactionCount + m.transactionCount,
    }),
    { ...zeroMonth }
  );

  const currentMonthData =
    selectedMonth === 'all'
      ? allTimeData
      : (monthlyStatsFiltered[0] || zeroMonth);

  const previousMonthData = (() => {
    if (selectedMonth === 'all') {
      return monthlyStatsAll[1] || currentMonthData;
    }
    const idx = monthlyStatsAll.findIndex((m) => m.month === selectedMonth);
    return idx >= 0 ? (monthlyStatsAll[idx + 1] || currentMonthData) : currentMonthData;
  })();

  const debitTrend =
    previousMonthData.totalDebit > 0
      ? ((currentMonthData.totalDebit - previousMonthData.totalDebit) /
          previousMonthData.totalDebit) *
        100
      : 0;

  const creditTrend =
    previousMonthData.totalCredit > 0
      ? ((currentMonthData.totalCredit - previousMonthData.totalCredit) /
          previousMonthData.totalCredit) *
        100
      : 0;

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const categoryTransactions = selectedCategory
    ? filteredTransactions.filter(
        (t) => t.category === selectedCategory && t.type === 'Debit'
      )
    : [];

  // Calculate reimbursements for this specific category
  const categoryReimbursements = filteredTransactions
    .filter(t => t.type === 'Credit' && t.is_reimbursement && t.category === selectedCategory)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryTotal = categoryTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  ) - categoryReimbursements;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Expense Dashboard</h1>
            <p className="text-zinc-400">Track your spending and financial insights</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-black border border-zinc-800">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="credits" 
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              Manage Credits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 sm:space-y-8 mt-6">
            <div className="flex justify-end">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[220px] bg-black border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-zinc-800 text-white">
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {getMonthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Spending"
            value={formatCurrency(currentMonthData.totalDebit)}
            subtitle={selectedMonth === 'all' ? 'All time' : 'This month'}
            icon={TrendingDown}
            trend={
              selectedMonth === 'all'
                ? undefined
                : {
                    value: debitTrend,
                    isPositive: debitTrend < 0,
                  }
            }
          />
          <StatCard
            title="Total Income"
            value={formatCurrency(currentMonthData.totalCredit)}
            subtitle={selectedMonth === 'all' ? 'All time' : 'This month'}
            icon={TrendingUp}
            trend={
              selectedMonth === 'all'
                ? undefined
                : {
                    value: creditTrend,
                    isPositive: creditTrend > 0,
                  }
            }
          />
          <StatCard
            title="Net Balance"
            value={formatCurrency(Math.abs(currentMonthData.netAmount))}
            subtitle={
              currentMonthData.netAmount >= 0 ? 'Surplus' : 'Deficit'
            }
            icon={Wallet}
          />
          <StatCard
            title="Transactions"
            value={currentMonthData.transactionCount.toString()}
            subtitle={selectedMonth === 'all' ? 'All time' : 'This month'}
            icon={Calendar}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingChart data={monthlyStatsAll} />
          <DailySpendingChart data={dailyStats} />
        </div>

        <Card className="bg-black border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryBreakdown.map((cat) => (
                <CategoryCard
                  key={cat.category}
                  data={cat}
                  onClick={() => handleCategoryClick(cat.category)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTable transactions={filteredTransactions.slice(0, 20)} />
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="credits" className="mt-6">
            <CreditsManagement 
              transactions={transactions} 
              onUpdate={fetchTransactions}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CategoryDetailDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory || ''}
        transactions={categoryTransactions}
        totalAmount={categoryTotal}
      />
    </div>
  );
}
