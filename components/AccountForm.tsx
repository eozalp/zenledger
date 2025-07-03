import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface AccountFormProps {
    accounts: Account[];
    addAccount: (acc: Omit<Account, 'id'>) => Promise<void>;
    onDone: () => void;
    parentId?: number;
}

export const AccountForm: React.FC<AccountFormProps> = ({ accounts, addAccount, onDone, parentId }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.Asset);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Account name is required.');
            return;
        }
        try {
            await addAccount({ name, type, parentId });
            onDone();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-zinc-800 rounded-lg">
             {error && <p className="text-red-400 bg-red-900/50 p-2 rounded">{error}</p>}
            <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-zinc-300">Account Name</label>
                <input
                    type="text"
                    id="accountName"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3"
                    required
                    autoFocus
                />
            </div>
            <div>
                <label htmlFor="accountType" className="block text-sm font-medium text-zinc-300">Account Type</label>
                <select
                    id="accountType"
                    value={type}
                    onChange={e => setType(e.target.value as AccountType)}
                    className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3"
                >
                    {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-3">
                 <button type="button" onClick={onDone} className="px-6 py-3 font-medium text-zinc-200 bg-zinc-600 rounded-md hover:bg-zinc-500">Cancel</button>
                <button type="submit" className="px-6 py-3 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5"/>
                    Add Account
                </button>
            </div>
        </form>
    );
};
