import React, { useState, useEffect } from 'react';
import { JournalEntry, Account } from '../types';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { RotateCcwIcon } from './icons/RotateCcwIcon';
import { useCurrency } from '../contexts/CurrencyContext';

interface TransactionItemProps {
    transaction: JournalEntry;
    accounts: Account[];
    onSelectAttachment: (src: string) => void;
    revertTransaction: (entry: JournalEntry) => Promise<void>;
    index: number; // For staggered animation
}

const TransactionItem: React.FC<TransactionItemProps> = ({
    transaction: t,
    accounts,
    onSelectAttachment,
    revertTransaction,
    index,
}) => {
    const getAccountName = (id: number) => accounts.find(a => a.id === id)?.name || 'Unknown Account';
    const { formatCurrency } = useCurrency();

    const handleRevert = (entry: JournalEntry) => {
        if(window.confirm('Are you sure you want to revert this transaction? This will create a new journal entry that reverses the original debits and credits.')){
            revertTransaction(entry).catch(err => console.error('Revert transaction failed:', err));
        }
    }

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, index * 50); // Stagger by 50ms per item
        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div key={t.id} className={`bg-zinc-900 border border-zinc-800 rounded-lg p-5 transition-opacity transition-transform duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-4">
                    <p className="font-semibold text-zinc-100 text-lg">{t.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-base text-zinc-400">{new Date(t.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p>
                        {t.attachment && (
                            <button onClick={() => onSelectAttachment(t.attachment!)} className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
                                <PaperclipIcon className="w-4 h-4" />
                                View Receipt
                            </button>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => handleRevert(t)}
                    title="Revert Transaction"
                    className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700 rounded-full transition-colors"
                >
                    <RotateCcwIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="border-t border-zinc-700 pt-3">
                 <div className="grid grid-cols-12 gap-x-2 text-sm text-zinc-500 font-sans pb-1">
                    <div className="col-span-6 md:col-span-8">Account</div>
                    <div className="col-span-3 md:col-span-2 text-right">Debit</div>
                    <div className="col-span-3 md:col-span-2 text-right">Credit</div>
                </div>
                 {t.lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-12 gap-x-2 text-base py-1">
                        <div className="col-span-6 md:col-span-8 text-zinc-300 truncate">{getAccountName(line.accountId)}</div>
                        <div className="col-span-3 md:col-span-2 text-right font-mono text-debit">
                            {line.debit > 0 ? formatCurrency(line.debit) : ''}
                        </div>
                        <div className="col-span-3 md:col-span-2 text-right font-mono text-credit">
                            {line.credit > 0 ? formatCurrency(line.credit) : ''}
                        </div>
                    </div>
                 ))}
            </div>
        </div>
    );
};

export default TransactionItem;