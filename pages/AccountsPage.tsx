import React, { useState, useMemo } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { Account, AccountType } from '../types';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { AccountItem } from '../components/AccountItem';
import { AccountForm } from '../components/AccountForm';

interface AccountsPageProps {
  db: ReturnType<typeof useDatabase>;
}

const AccountsPage: React.FC<AccountsPageProps> = ({ db }) => {
  const { accounts, addAccount, updateAccount, deleteAccount } = db;
  const [showForm, setShowForm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const accountsTree = useMemo(() => {
    if (!accounts) return [];
    const map: { [key: number]: any } = {};
    const roots: any[] = [];

    accounts.forEach(account => {
      map[account.id] = { ...account, children: [] };
    });

    accounts.forEach(account => {
      if (account.parentId) {
        map[account.parentId]?.children.push(map[account.id]);
      } else {
        roots.push(map[account.id]);
      }
    });

    return roots;
  }, [accounts]);

  const groupedAccounts = useMemo(() => {
      return accountsTree.reduce((acc, account) => {
        (acc[account.type] = acc[account.type] || []).push(account);
        return acc;
      }, {} as Record<AccountType, any[]>)
  }, [accountsTree]);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-zinc-100">Chart of Accounts</h1>
             {!showForm && (
                 <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                    <PlusCircleIcon className="w-6 h-6"/>
                    New Account
                 </button>
             )}
        </div>

        {showForm && <AccountForm accounts={accounts || []} addAccount={addAccount} onDone={() => setShowForm(false)} />}
        
        {deleteError && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg">{deleteError}</p>}

        {accounts === undefined ? (
            <p className="text-center p-8">Loading accounts...</p>
        ) : (
            <div className="space-y-8">
            {Object.keys(groupedAccounts).map((type) => (
                <div key={type}>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-3 px-2">{type}</h2>
                    <ul className="space-y-3">
                        {groupedAccounts[type as AccountType].map((account: any, idx: number) => (
                            <AccountItem
                                key={account.id}
                                account={account}
                                index={idx}
                                addAccount={addAccount}
                                updateAccount={updateAccount}
                                deleteAccount={deleteAccount}
                                setDeleteError={setDeleteError}
                            />
                        ))}
                    </ul>
                </div>
            ))}
            </div>
        )}
    </div>
  );
};

export default AccountsPage;
