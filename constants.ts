import { Account, AccountType, SettingKey } from './types';

export const DB_NAME = 'ZenLedgerDB';

export const AUTO_BACKUP_KEY = 'zenledger-autobackup';

export const FOLDER_HANDLE_KEY = SettingKey.FolderHandle;

export const INITIAL_ACCOUNTS: Omit<Account, 'id'>[] = [
  // Assets
  { name: 'Cash', type: AccountType.Asset },
  { name: 'Customer Invoices', type: AccountType.Asset },
  { name: 'Loans Receivable', type: AccountType.Asset },
  { name: 'Office Supplies', type: AccountType.Asset },
  { name: 'Equipment', type: AccountType.Asset },
  
  // Liabilities
  { name: 'Bills to Pay', type: AccountType.Liability },
  { name: 'Loans Payable', type: AccountType.Liability },
  { name: 'Unearned Revenue', type: AccountType.Liability },

  // Equity
  { name: 'Owner Investment', type: AccountType.Equity },
  { name: 'Owner Withdrawal', type: AccountType.Equity },
  
  // Revenue
  { name: 'Product Sales', type: AccountType.Revenue },
  { name: 'Service Income', type: AccountType.Revenue },
  
  // Expenses
  { name: 'Rent Expense', type: AccountType.Expense },
  { name: 'Utilities Expense', type: AccountType.Expense },
  { name: 'Wages & Salaries', type: AccountType.Expense },
  
  // Investment
  { name: 'Stock Portfolio', type: AccountType.Investment },
];
