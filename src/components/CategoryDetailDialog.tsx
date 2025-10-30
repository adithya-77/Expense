import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Transaction } from '../lib/supabase';
import { TransactionTable } from './TransactionTable';
import { formatCurrency } from '../lib/transactionUtils';

interface CategoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  transactions: Transaction[];
  totalAmount: number;
}

export function CategoryDetailDialog({
  open,
  onOpenChange,
  category,
  transactions,
  totalAmount,
}: CategoryDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-zinc-800 text-white overflow-hidden flex flex-col w-[100vw] h-[100dvh] rounded-none p-4 sm:p-6 sm:w-full sm:h-auto sm:max-w-6xl sm:max-h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white mb-2">
                {category}
              </DialogTitle>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>Total: {formatCurrency(totalAmount)}</span>
                <span>•</span>
                <span>{transactions.length} transactions</span>
              </div>
            </div>
            {/* Rely on the default close button provided by DialogContent */}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto mt-4">
          <TransactionTable transactions={transactions} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
