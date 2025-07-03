import { useEffect } from 'react';
import { Account, JournalEntry, FavoriteTransaction } from '../types';
import { AUTO_BACKUP_KEY } from '../constants';

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

const backupToLocalStorage = (accounts: Account[], transactions: JournalEntry[], favoriteTransactions: FavoriteTransaction[]) => {
    console.log('Performing automatic backup...');
    const backupData = {
        backupDate: new Date().toISOString(),
        accounts,
        transactions,
        favoriteTransactions
    };
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backupData));
};

const debouncedBackup = debounce(backupToLocalStorage, 3000); // Backup 3 seconds after the last change

export const useAutoBackup = (accounts?: Account[], transactions?: JournalEntry[], favoriteTransactions?: FavoriteTransaction[]) => {
  useEffect(() => {
    // Only backup if all data streams have loaded
    if (accounts && transactions && favoriteTransactions) {
        // And if there's actually data to save
        if (accounts.length > 0 || transactions.length > 0 || favoriteTransactions.length > 0) {
            debouncedBackup(accounts, transactions, favoriteTransactions);
        }
    }
  }, [accounts, transactions, favoriteTransactions]);
};