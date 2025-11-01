import { useState, useMemo } from 'react';
import { supabase, Transaction } from '../lib/supabase';
import { formatCurrency, getMonthLabel } from '../lib/transactionUtils';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { groupTransactionsByMonth, filterTransactionsByMonth } from '../lib/transactionUtils';
import { Loader2 } from 'lucide-react';

interface CreditsManagementProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

export function CreditsManagement({ transactions, onUpdate }: CreditsManagementProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const availableMonths = groupTransactionsByMonth(transactions);
  
  const filteredTransactions =
    selectedMonth === 'all'
      ? transactions
      : filterTransactionsByMonth(transactions, selectedMonth);

  const creditTransactions = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'Credit')
      .sort((a, b) => {
        // Primary sort: by date (newest first)
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        // Secondary sort: by ID (stable ordering for same date)
        return b.id - a.id;
      });
  }, [filteredTransactions]);

  const handleReimbursementToggle = async (
    transaction: Transaction,
    isReimbursement: boolean
  ) => {
    setUpdatingIds(prev => new Set(prev).add(transaction.id));
    
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_reimbursement: isReimbursement })
        .eq('id', transaction.id);

      if (error) throw error;
      
      // Refresh to get the latest data from database (for consistency)
      // But the optimistic update prevents the visual jump
      onUpdate();
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction. Please try again.');
      // Optionally revert optimistic update on error
      onUpdate();
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(transaction.id);
        return next;
      });
    }
  };

  const reimbursementCount = creditTransactions.filter(t => t.is_reimbursement).length;
  const incomeCount = creditTransactions.length - reimbursementCount;
  const totalReimbursements = creditTransactions
    .filter(t => t.is_reimbursement)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = creditTransactions
    .filter(t => !t.is_reimbursement)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-1">Manage Credits</h2>
          <p className="text-zinc-400 text-sm">
            Mark credits as reimbursements or income
          </p>
        </div>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-black border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{creditTransactions.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Reimbursements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{reimbursementCount}</div>
            <div className="text-xs text-zinc-500 mt-1">{formatCurrency(totalReimbursements)}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{incomeCount}</div>
            <div className="text-xs text-zinc-500 mt-1">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Unmarked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {creditTransactions.filter(t => t.is_reimbursement === undefined || t.is_reimbursement === null).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Credit Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {creditTransactions.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  No credit transactions found for the selected period.
                </div>
              ) : (
                creditTransactions.map((transaction) => {
                  const isUpdating = updatingIds.has(transaction.id);
                  const isReimbursement = transaction.is_reimbursement === true;

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {isUpdating ? (
                            <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
                          ) : (
                            <Checkbox
                              checked={isReimbursement}
                              onCheckedChange={(checked) =>
                                handleReimbursementToggle(transaction, checked === true)
                              }
                              className="border-zinc-700 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium truncate">
                              {transaction.description}
                            </span>
                            <Badge
                              variant={isReimbursement ? 'default' : 'outline'}
                              className={
                                isReimbursement
                                  ? 'bg-green-900/30 text-green-400 border-green-800'
                                  : 'bg-blue-900/30 text-blue-400 border-blue-800'
                              }
                            >
                              {isReimbursement ? 'Reimbursement' : 'Income'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-zinc-400">
                            <span>{format(parseISO(transaction.date), 'dd MMM yyyy')}</span>
                            <span>•</span>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs">
                              {transaction.category}
                            </Badge>
                            <span>•</span>
                            <span>{transaction.account}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-green-400">
                            +{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

