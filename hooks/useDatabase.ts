
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Account, AccountType, JournalEntry, JournalEntryLine, FavoriteTransaction, Currency, Setting } from '../types';

export const useDatabase = () => {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray(),
    []
  );

  const favoriteTransactions = useLiveQuery(
    () => db.favoriteTransactions.toArray(),
    []
  );

  const currencies = useLiveQuery(() => db.currencies.toArray(), []);
  
  const settings = useLiveQuery(() => db.settings.toArray(), []);

  const addAccount = async (account: Omit<Account, 'id'>) => {
    try {
      await db.accounts.add(account as Account);
    } catch (e) {
      console.error(e);
      throw new Error('Failed to add account. Name might already exist.');
    }
  };

  const updateAccount = async (id: number, updates: Partial<Account>) => {
    try {
      if (updates.name) {
        const existing = await db.accounts.where('name').equalsIgnoreCase(updates.name).first();
        if (existing && existing.id !== id) {
          throw new Error('An account with this name already exists.');
        }
      }
      await db.accounts.update(id, updates);
    } catch (e) {
      console.error(e);
      throw e; // Re-throw to be caught in the component
    }
  };

  const deleteAccount = async (accountId: number) => {
    return db.transaction('rw', db.accounts, db.transactions, db.favoriteTransactions, async () => {
        // 1. Check for sub-accounts
        const childCount = await db.accounts.where('parentId').equals(accountId).count();
        if (childCount > 0) {
            throw new Error('Cannot delete account. It has sub-accounts linked to it.');
        }

        // 2. Check for usage in transactions
        const transactionUsage = await db.transactions.where('lines.accountId').equals(accountId).count();
        if (transactionUsage > 0) {
            throw new Error('Cannot delete account. It is used in one or more journal entries.');
        }

        // 3. Check for usage in favorite transactions
        const favoriteUsage = await db.favoriteTransactions.filter(fav => 
            fav.fromAccountId === accountId || 
            fav.toAccountId === accountId || 
            fav.categoryAccountId === accountId
        ).count();

        if (favoriteUsage > 0) {
            throw new Error('Cannot delete account. It is used in one or more favorite transactions.');
        }

        // 4. If no dependencies, delete the account
        await db.accounts.delete(accountId);
    });
  };

  const addTransaction = async (transaction: Omit<JournalEntry, 'id'>) => {
    try {
      await db.transactions.add(transaction as JournalEntry);
    } catch (e) {
      console.error(e);
      throw new Error('Failed to add transaction.');
    }
  };

  const revertTransaction = async (originalEntry: JournalEntry) => {
    const reversedLines: JournalEntryLine[] = originalEntry.lines.map(line => ({
      accountId: line.accountId,
      debit: line.credit, // Swap debit and credit
      credit: line.debit,  // Swap credit and debit
    }));

    const reversalEntry: Omit<JournalEntry, 'id'> = {
      date: new Date().toISOString().split('T')[0], // Use today's date for the reversal
      description: `Reversal of: ${originalEntry.description}`,
      lines: reversedLines,
      // Do not include original attachment in reversal
    };
    
    try {
        await addTransaction(reversalEntry);
    } catch (e) {
        console.error(e);
        throw new Error('Failed to create reversal transaction.');
    }
  };

  const addFavoriteTransaction = async (favorite: Omit<FavoriteTransaction, 'id'>) => {
    try {
        await db.favoriteTransactions.add(favorite as FavoriteTransaction);
    } catch (e) {
        console.error(e);
        throw new Error('Failed to add favorite. Name might already exist.');
    }
  };

  const deleteFavoriteTransaction = async (id: number) => {
      try {
          await db.favoriteTransactions.delete(id);
      } catch (e) {
          console.error(e);
          throw new Error('Failed to delete favorite.');
      }
  };

  const addCurrency = async (currency: Omit<Currency, 'id'>) => {
    try {
      await db.currencies.add(currency as Currency);
    } catch(e) {
      console.error(e);
      throw new Error('Failed to add currency. Code might already exist.');
    }
  };

  const updateCurrency = async (id: number, updates: Partial<Currency>) => {
    await db.currencies.update(id, updates);
  };
  
  const deleteCurrency = async (id: number) => {
    await db.currencies.delete(id);
  };

  const setSetting = async (setting: Setting) => {
    await db.settings.put(setting);
  };


  return { 
      accounts, 
      transactions,
      favoriteTransactions,
      currencies,
      settings,
      addAccount, 
      updateAccount,
      deleteAccount,
      addTransaction,
      revertTransaction,
      addFavoriteTransaction,
      deleteFavoriteTransaction,
      addCurrency,
      updateCurrency,
      deleteCurrency,
      setSetting,
  };
};
