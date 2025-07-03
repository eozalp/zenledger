
import Dexie, { type Table, type Transaction } from 'dexie';
import { DB_NAME, INITIAL_ACCOUNTS } from './constants';
import { Account, JournalEntry, FavoriteTransaction, Currency, Setting, SettingKey } from './types';

// The class-based approach was causing type resolution errors with Dexie's methods.
// This instance-based approach is also recommended by Dexie docs and avoids inheritance issues.
const db = new Dexie(DB_NAME) as Dexie & {
  accounts: Table<Account, number>;
  transactions: Table<JournalEntry, number>;
  favoriteTransactions: Table<FavoriteTransaction, number>;
  settings: Table<Setting, string>;
  currencies: Table<Currency, number>;
};

// --- CORRECTED DEXIE VERSIONING ---
// The `stores()` method for each version must define the FULL schema at that point in time, not just the changes.
// This was the root cause of the application crash.

// Version 1: Initial schema
db.version(1).stores({
  accounts: '++id, &name, type',
  transactions: '++id, date',
});

// Version 2: Add favoriteTransactions table
db.version(2).stores({
  accounts: '++id, &name, type', // Keep old tables
  transactions: '++id, date', // Keep old tables
  favoriteTransactions: '++id, &name'
}).upgrade(tx => {
  // No data migration needed, just adding a new table.
  return tx.table("favoriteTransactions").count();
});

// Version 3: No schema change, just noting attachment field is optional.
db.version(3).stores({
  accounts: '++id, &name, type',
  transactions: '++id, date',
  favoriteTransactions: '++id, &name'
});

// Version 4: Add settings table
db.version(4).stores({
  accounts: '++id, &name, type',
  transactions: '++id, date',
  favoriteTransactions: '++id, &name',
  settings: 'key' // Use 'key' as the primary key
});

// This function will be called during both initial population and version upgrade
// to ensure all users have a default currency.
const populateInitialCurrency = async (tx: Transaction) => {
    const currenciesTable = tx.table('currencies');
    const settingsTable = tx.table('settings');

    const usdExists = await currenciesTable.where('code').equals('USD').count() > 0;
    if (!usdExists) {
        const usdId = await currenciesTable.add({
            name: 'US Dollar',
            code: 'USD',
            symbol: '$',
            exchangeRate: 1,
        });
        
        // Set USD as default and display currency initially
        await settingsTable.put({ key: SettingKey.DefaultCurrencyId, value: usdId });
        await settingsTable.put({ key: SettingKey.DisplayCurrencyId, value: usdId });
    }
};

// Version 5: Add currencies table and default currency settings
db.version(5).stores({
  accounts: '++id, &name, type',
  transactions: '++id, date',
  favoriteTransactions: '++id, &name',
  settings: 'key',
  currencies: '++id, &code'
}).upgrade(populateInitialCurrency);

// Version 6: Add parentId for sub-accounts
db.version(6).stores({
  accounts: '++id, &name, type, parentId',
  transactions: '++id, date',
  favoriteTransactions: '++id, &name',
  settings: 'key',
  currencies: '++id, &code'
});

// Version 7: Add index for lines.accountId in transactions table
db.version(7).stores({
  accounts: '++id, &name, type, parentId',
  transactions: '++id, date, *lines.accountId', // Add multi-entry index
  favoriteTransactions: '++id, &name',
  settings: 'key',
  currencies: '++id, &code'
});

// Version 16: Cumulative schema update to fix blank screen bug
db.version(16).stores({
  accounts: '++id, &name, type, parentId',
  transactions: '++id, date, *lines.accountId',
  favoriteTransactions: '++id, &name',
  settings: 'key',
  currencies: '++id, &code'
});


// The populate event is fired only when the DB is created for the first time.
// We use it to seed the database with essential starting data.
db.on('populate', async (tx) => {
    // Use the transaction 'tx' to populate all initial data atomically.
    await tx.table('accounts').bulkAdd(INITIAL_ACCOUNTS as Account[]);
    await populateInitialCurrency(tx);
});


export { db };

export const exportData = async (): Promise<string> => {
    const data = await db.transaction('r', [db.accounts, db.transactions, db.favoriteTransactions, db.currencies, db.settings], async () => {
        const accounts = await db.accounts.toArray();
        const transactions = await db.transactions.toArray();
        const favoriteTransactions = await db.favoriteTransactions.toArray();
        const currencies = await db.currencies.toArray();
        const settings = await db.settings.toArray();
        return { accounts, transactions, favoriteTransactions, currencies, settings };
    });
    return JSON.stringify(data, null, 2);
};

export const importData = async (jsonString: string): Promise<void> => {
    const data = JSON.parse(jsonString);
    const { accounts, transactions, favoriteTransactions, currencies, settings } = data;

    if (!Array.isArray(accounts) || !Array.isArray(transactions)) {
        throw new Error('Invalid JSON format: missing accounts or transactions array.');
    }

    await db.transaction('rw', [db.accounts, db.transactions, db.favoriteTransactions, db.currencies, db.settings], async () => {
        await db.accounts.clear();
        await db.transactions.clear();
        await db.favoriteTransactions.clear();
        await db.currencies.clear();
        await db.settings.clear();
        
        await db.accounts.bulkAdd(accounts);
        await db.transactions.bulkAdd(transactions);
        if (Array.isArray(favoriteTransactions)) {
            await db.favoriteTransactions.bulkAdd(favoriteTransactions);
        }
        if (Array.isArray(currencies)) {
            await db.currencies.bulkAdd(currencies);
        }
        if (Array.isArray(settings)) {
            await db.settings.bulkAdd(settings);
        }
    });
};