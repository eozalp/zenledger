import React from 'react';
import { JournalEntry, Account } from '../types';
import TransactionItem from './TransactionItem';

interface TransactionListProps {
    transactions: JournalEntry[];
    accounts: Account[];
    onSelectAttachment: (src: string) => void;
    revertTransaction: (entry: JournalEntry) => Promise<void>;
}

const TransactionList: React.FC<TransactionListProps> = ({
    transactions,
    accounts,
    onSelectAttachment,
    revertTransaction,
}) => {
    return (
        <div className="space-y-4">
            {transactions.map((t, index) => (
                <TransactionItem
                    key={t.id}
                    transaction={t}
                    accounts={accounts}
                    onSelectAttachment={onSelectAttachment}
                    revertTransaction={revertTransaction}
                    index={index}
                />
            ))}
        </div>
    );
};

export default TransactionList;