
import React, { useState, useMemo, useEffect } from 'react';
import TransactionItem from '../components/TransactionItem';
import { useDatabase } from '../hooks/useDatabase';
import { Account, AccountType, JournalEntry, JournalEntryLine } from '../types';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { XIcon } from '../components/icons/XIcon';
import { QuestionMarkIcon } from '../components/icons/QuestionMarkIcon';
import { useCurrency } from '../contexts/CurrencyContext';
import InfoModal from '../components/InfoModal';
import DebitCreditExplanation from '../components/DebitCreditExplanation';

interface TransactionsPageProps {
  db: ReturnType<typeof useDatabase>;
}

type FormLine = {
  key: string;
  accountId?: number;
  amount: string;
  isDebit: boolean;
};

const TransactionForm: React.FC<{
  accounts: Account[];
  addTransaction: (trans: Omit<JournalEntry, 'id'>) => Promise<void>;
  onDone: () => void;
}> = ({ accounts, addTransaction, onDone }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<FormLine[]>([
    { key: `line-${Date.now()}-0`, accountId: undefined, amount: '', isDebit: true },
    { key: `line-${Date.now()}-1`, accountId: undefined, amount: '', isDebit: true },
  ]);
  const [error, setError] = useState('');
  const { defaultCurrency } = useCurrency();

  const getNaturalEntryTypeIsDebit = (accountId: number): boolean => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return true; // Default to debit if not found
    switch (account.type) {
      case AccountType.Asset:
      case AccountType.Expense:
        return true; // Debit increases these
      case AccountType.Liability:
      case AccountType.Equity:
      case AccountType.Revenue:
        return false; // Credit increases these
      default:
        return true;
    }
  };

  const handleLineChange = (index: number, field: keyof FormLine, value: any) => {
    const newLines = [...lines];
    const line = { ...newLines[index], [field]: value };

    if (field === 'accountId' && value) {
      line.isDebit = getNaturalEntryTypeIsDebit(Number(value));
    }
    
    newLines[index] = line;
    setLines(newLines);
  };

  const addLine = () => setLines([...lines, { key: `line-${Date.now()}-${lines.length}`, accountId: undefined, amount: '', isDebit: true }]);
  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

  const { totalDebits, totalCredits, isBalanced } = useMemo(() => {
    const totals = lines.reduce(
      (acc, line) => {
        const amount = Number(line.amount || 0);
        if (line.isDebit) {
          acc.totalDebits += amount;
        } else {
          acc.totalCredits += amount;
        }
        return acc;
      },
      { totalDebits: 0, totalCredits: 0 }
    );
    const balanced = Math.abs(totals.totalDebits - totals.totalCredits) < 0.001 && totals.totalDebits > 0;
    return { ...totals, isBalanced: balanced };
  }, [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lines.some(l => !l.accountId || !l.amount)) {
      setError('All lines must have an account and an amount greater than zero.');
      return;
    }
    
    if (!isBalanced) {
      setError('Debits and Credits must be equal and not zero.');
      return;
    }

    const finalLines: JournalEntryLine[] = lines
      .filter(l => l.accountId && Number(l.amount) > 0)
      .map(l => ({
        accountId: l.accountId!,
        debit: l.isDebit ? Number(l.amount) : 0,
        credit: !l.isDebit ? Number(l.amount) : 0,
      }));

    if (finalLines.length < 2) {
      setError('A transaction must have at least two lines.');
      return;
    }

    try {
      await addTransaction({ date, description, lines: finalLines });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700 mb-6">
      <p className="text-sm text-center p-2 bg-zinc-700 rounded-md text-zinc-300">
        All amounts in this form are in your default currency: <strong>{defaultCurrency?.code}</strong>
      </p>
      {error && <p className="text-red-400 bg-red-900/50 p-2 rounded">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-zinc-300">Date</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full bg-zinc-700 border-zinc-600 rounded-md p-3 text-base" required />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300">Description</label>
          <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full bg-zinc-700 border-zinc-600 rounded-md p-3 text-base" required placeholder="e.g., Paid monthly rent" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-sm text-zinc-400 px-2">
            <div className="sm:col-span-5">Account</div>
            <div className="sm:col-span-3 text-right">Amount</div>
            <div className="sm:col-span-3 text-center">Type</div>
        </div>
        {lines.map((line, index) => (
          <div key={line.key} className="grid grid-cols-12 gap-2 items-center bg-zinc-900/50 p-2 rounded-lg">
            <div className="col-span-12 sm:col-span-5">
              <select value={line.accountId || 0} onChange={e => handleLineChange(index, 'accountId', Number(e.target.value))} className="w-full bg-zinc-700 border-zinc-600 rounded-md p-3 text-base">
                <option value="0">Select account...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center text-zinc-400">{defaultCurrency?.symbol}</span>
                <input type="number" step="0.01" min="0" value={line.amount} onChange={e => handleLineChange(index, 'amount', e.target.value)} className="w-full text-right bg-zinc-700 border-zinc-600 rounded-md p-3 font-mono text-base pl-7" placeholder="0.00" />
              </div>
            </div>
            <div className="col-span-4 sm:col-span-3">
              <div className="flex rounded-md h-full" role="group">
                <button type="button" onClick={() => handleLineChange(index, 'isDebit', true)} className={`flex-1 px-2 py-3 text-sm font-medium rounded-l-lg transition-colors ${line.isDebit ? 'bg-debit/20 text-debit border border-debit' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600'}`}>
                  DR
                </button>
                <button type="button" onClick={() => handleLineChange(index, 'isDebit', false)} className={`flex-1 px-2 py-3 text-sm font-medium rounded-r-lg transition-colors ${!line.isDebit ? 'bg-credit/20 text-credit border border-credit' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600'}`}>
                  CR
                </button>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 flex justify-center">
                <button type="button" onClick={() => removeLine(index)} className="text-zinc-500 hover:text-red-400">
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLine} className="text-indigo-400 hover:text-indigo-300 text-base flex items-center gap-2 pt-2">
          <PlusCircleIcon className="w-5 h-5" />
          Add Line
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-zinc-700">
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-base">
          <span>Debits: <span className="text-debit">{defaultCurrency?.symbol}{totalDebits.toFixed(2)}</span></span>
          <span>Credits: <span className="text-credit">{defaultCurrency?.symbol}{totalCredits.toFixed(2)}</span></span>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <button type="button" onClick={onDone} className="flex-1 sm:flex-none px-6 py-3 font-medium text-zinc-200 bg-zinc-700 rounded-md hover:bg-zinc-600">Cancel</button>
          <button type="submit" disabled={!isBalanced} className="flex-1 sm:flex-none px-6 py-3 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-zinc-500 disabled:cursor-not-allowed">Save Entry</button>
        </div>
      </div>
    </form>
  );
};

const ImageViewerModal: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-zinc-300 z-10">
            <XIcon className="w-8 h-8" />
        </button>
        <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <img src={src} alt="Transaction Attachment" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
    </div>
);




const TransactionsPage: React.FC<TransactionsPageProps> = ({ db }) => {
  const { accounts, transactions, addTransaction, revertTransaction } = db;
  const [showForm, setShowForm] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-zinc-100">Journal Entries</h1>
            <div className="flex items-center gap-2">
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-base font-medium text-white bg-zinc-600 rounded-md hover:bg-zinc-500 disabled:bg-zinc-800" disabled={!accounts || accounts.length === 0}>
                    <PlusCircleIcon className="w-5 h-5"/>
                    Advanced Entry
                    </button>
                )}
                <button onClick={() => setShowExplanationModal(true)} className="p-2 text-zinc-400 hover:text-white">
                    <QuestionMarkIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>

        {showForm && accounts && <TransactionForm accounts={accounts} addTransaction={addTransaction} onDone={() => setShowForm(false)} />}
        
        {transactions === undefined || accounts === undefined ? (
            <p className="text-center p-8">Loading transactions...</p>
        ) : transactions.length > 0 ? (
            <div className="space-y-4">
                {transactions.map((t, index) => (
                    <TransactionItem
                        key={t.id}
                        transaction={t}
                        accounts={accounts}
                        onSelectAttachment={setViewingAttachment}
                        revertTransaction={revertTransaction}
                        index={index}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-10 bg-zinc-900 rounded-lg border border-dashed border-zinc-700">
                <h3 className="text-lg font-medium text-zinc-300">No transactions yet</h3>
                <p className="text-zinc-500 mt-2">Tap the big "+" button below to get started.</p>
            </div>
        )}

        {viewingAttachment && <ImageViewerModal src={viewingAttachment} onClose={() => setViewingAttachment(null)} />}

        <InfoModal
            isOpen={showExplanationModal}
            onClose={() => setShowExplanationModal(false)}
            title="Debits and Credits Explained"
        >
            <DebitCreditExplanation />
        </InfoModal>
    </div>
  );
};

export default TransactionsPage;
