
export enum AccountType {
  Asset = 'Asset',
  Liability = 'Liability',
  Equity = 'Equity',
  Revenue = 'Revenue',
  Expense = 'Expense',
  Investment = 'Investment',
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  parentId?: number;
  initialBalance?: number; // Optional: For initial setup, recorded via journal entry
}

export interface JournalEntryLine {
  accountId: number;
  debit: number; // Always in default currency
  credit: number; // Always in default currency
}

export interface JournalEntry {
  id: number;
  date: string; // ISO string format
  description: string;
  lines: JournalEntryLine[];
  attachment?: string; // base64 encoded image data
}

export enum FavoriteTransactionType {
    Expense = 'expense',
    Revenue = 'revenue',
    Borrow = 'borrow',
    Lend = 'lend',
}

export interface FavoriteTransaction {
    id: number;
    name: string;
    type: FavoriteTransactionType;
    fromAccountId?: number; // for expense, lend
    toAccountId?: number; // for revenue, borrow
    categoryAccountId: number;
    defaultDescription?: string;
}

export interface Currency {
    id: number;
    name: string;
    code: string; // e.g., USD, EUR
    symbol: string; // e.g., $, €
    exchangeRate: number; // Rate to convert FROM this currency TO the default currency. Default currency has rate 1.
}

export interface Setting {
    key: string;
    value: any;
}

export enum SettingKey {
    DefaultCurrencyId = 'defaultCurrencyId',
    DisplayCurrencyId = 'displayCurrencyId',
    DefaultEntryCurrencyId = 'defaultEntryCurrencyId',
    FolderHandle = 'backupFolderHandle',
}
