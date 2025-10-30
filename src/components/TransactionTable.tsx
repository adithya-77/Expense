import { Transaction } from '../lib/supabase';
import { formatCurrency } from '../lib/transactionUtils';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-zinc-900">
            <TableHead className="text-zinc-400">Date</TableHead>
            <TableHead className="text-zinc-400">Description</TableHead>
            <TableHead className="text-zinc-400">Category</TableHead>
            <TableHead className="text-zinc-400">Account</TableHead>
            <TableHead className="text-zinc-400">Type</TableHead>
            <TableHead className="text-right text-zinc-400">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className="border-zinc-800 hover:bg-zinc-900"
            >
              <TableCell className="text-zinc-300">
                {format(parseISO(transaction.date), 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="text-white font-medium">
                {transaction.description}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  {transaction.category}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-400">{transaction.account}</TableCell>
              <TableCell>
                <Badge
                  variant={transaction.type === 'Credit' ? 'default' : 'secondary'}
                  className={
                    transaction.type === 'Credit'
                      ? 'bg-green-900/30 text-green-400 border-green-800'
                      : 'bg-red-900/30 text-red-400 border-red-800'
                  }
                >
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  transaction.type === 'Credit' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {transaction.type === 'Credit' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
