import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '../types';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { AccountForm } from '../components/AccountForm';

interface AccountItemProps {
    account: Account & { children?: Account[] };
    level?: number;
    index: number;
    addAccount: (acc: Omit<Account, 'id'>) => Promise<void>;
    updateAccount: (id: number, updates: Partial<Account>) => Promise<void>;
    deleteAccount: (id: number) => Promise<void>;
    setDeleteError: (error: string) => void;
}

export const AccountItem: React.FC<AccountItemProps> = ({
    account,
    level = 0,
    index,
    addAccount,
    updateAccount,
    deleteAccount,
}) => {
    const [showSubAccountForm, setShowSubAccountForm] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
    const [editFormState, setEditFormState] = useState<Partial<Account>>({});
    const [editError, setEditError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, index * 50); // Stagger by 50ms per item
        return () => clearTimeout(timer);
    }, [index]);

    const handleEditClick = (acc: Account) => {
        setEditingAccountId(acc.id);
        setEditFormState({ name: acc.name, type: acc.type, parentId: acc.parentId });
        setEditError('');
    };

    const handleCancelEdit = () => {
        setEditingAccountId(null);
        setEditError('');
    };

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccountId) return;
        setEditError('');
        try {
            await updateAccount(editingAccountId, editFormState);
            setEditingAccountId(null);
        } catch (err) {
            setEditError((err as Error).message);
        }
    };

    const handleDeleteAccount = async (accountId: number) => {
        if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            try {
                await deleteAccount(accountId);
            } catch (err) {
                setDeleteError((err as Error).message); // Use setDeleteError from props
            }
        }
    };

    return (
        <li key={account.id} className={`bg-zinc-900 border border-zinc-800 rounded-lg ${level > 0 ? 'ml-4' : ''} transition-opacity transition-transform duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {editingAccountId === account.id ? (
                <form onSubmit={handleUpdateAccount} className="p-4 space-y-3">
                    {editError && <p className="text-red-400 bg-red-900/50 p-2 rounded text-sm">{editError}</p>}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={editFormState.name || ''}
                            onChange={e => setEditFormState({...editFormState, name: e.target.value})}
                            className="flex-grow bg-zinc-700 border-zinc-600 rounded-md p-2 text-base"
                        />
                        <select
                            value={editFormState.type}
                            onChange={e => setEditFormState({...editFormState, type: e.target.value as AccountType})}
                            className="bg-zinc-700 border-zinc-600 rounded-md p-2 text-base"
                        >
                            {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-600 rounded-md hover:bg-zinc-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save</button>
                    </div>
                </form>
            ) : (
                <div className="flex justify-between items-center p-4">
                    <span className="text-zinc-200 text-lg">{account.name}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowSubAccountForm(true)} className="p-1 text-zinc-400 hover:text-indigo-400" title="Add Sub-account">
                            <PlusCircleIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleEditClick(account)} className="p-1 text-zinc-400 hover:text-white" title="Edit Account">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteAccount(account.id)} className="p-1 text-zinc-400 hover:text-red-400" title="Delete Account">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            {showSubAccountForm && (
                <div className="p-4 border-t border-zinc-700">
                    <AccountForm accounts={[]} addAccount={addAccount} onDone={() => setShowSubAccountForm(false)} parentId={account.id} />
                </div>
            )}
            {account.children && account.children.length > 0 && (
                <ul className="space-y-2 p-2">
                    {account.children.map((child: any, idx: number) => (
                        <AccountItem
                                key={child.id}
                                account={child}
                                level={level + 1}
                                index={idx}
                                addAccount={addAccount}
                                updateAccount={updateAccount}
                                deleteAccount={deleteAccount}
                            />
                    ))}
                </ul>
            )}
        </li>
    );
};
