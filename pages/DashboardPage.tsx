
import React, { useMemo, useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { Account, AccountType, JournalEntryLine } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCurrency } from '../contexts/CurrencyContext';

interface DashboardPageProps {
  db: ReturnType<typeof useDatabase>;
}

interface AccountBalance extends Account {
    balance: number;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ db }) => {
  const { accounts, transactions } = db;
  const { formatCurrency, displayCurrency } = useCurrency();

  const accountBalances = useMemo<AccountBalance[]>(() => {
    if (!accounts || !transactions) return [];
    return accounts.map(account => {
      let balance = 0;
      transactions.forEach(transaction => {
        transaction.lines.forEach(line => {
          if (line.accountId === account.id) {
            balance += line.debit - line.credit;
          }
        });
      });
      // For Liability, Equity, Revenue, natural balance is credit.
      // We store balances as debit-positive, so we flip the sign for display where appropriate.
      if([AccountType.Liability, AccountType.Equity, AccountType.Revenue].includes(account.type)){
        balance = -balance;
      }
      return { ...account, balance };
    });
  }, [accounts, transactions]);

  const totals = useMemo(() => {
    const result = {
        debits: 0,
        credits: 0,
    };
    accountBalances.forEach(acc => {
        if ([AccountType.Asset, AccountType.Expense].includes(acc.type)) {
            result.debits += acc.balance;
        } else {
            result.credits += acc.balance;
        }
    });
    return result;
  }, [accountBalances]);

  const financialSummary = useMemo(() => {
      const assets = accountBalances.filter(a => a.type === AccountType.Asset).reduce((sum, a) => sum + a.balance, 0);
      const liabilities = accountBalances.filter(a => a.type === AccountType.Liability).reduce((sum, a) => sum + a.balance, 0);
      const equity = accountBalances.filter(a => a.type === AccountType.Equity).reduce((sum, a) => sum + a.balance, 0);
      const revenue = accountBalances.filter(a => a.type === AccountType.Revenue).reduce((sum, a) => sum + a.balance, 0);
      const expenses = accountBalances.filter(a => a.type === AccountType.Expense).reduce((sum, a) => sum + a.balance, 0);
      return { assets, liabilities, equity, netIncome: revenue - expenses };
  }, [accountBalances]);


  if (!accounts || !transactions || !displayCurrency) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }
  
  if(transactions.length === 0){
    return (
       <div className="text-center py-10">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Welcome to the Accounting PWA</h1>
            <p className="text-zinc-400 mb-8">It looks like you're new here. Let's get started!</p>
            <div className="text-center py-10 bg-zinc-900 rounded-lg border border-dashed border-zinc-700">
                <h3 className="text-lg font-medium text-zinc-300">No transactions yet</h3>
                <p className="text-zinc-500 mt-2">Tap the big "+" button below to record your first expense or sale.</p>
            </div>
        </div>
    )
  }
  
  const balanceData = [
    { name: 'Assets', value: financialSummary.assets },
    { name: 'Liabilities', value: financialSummary.liabilities },
    { name: 'Equity', value: financialSummary.equity },
  ];

  const expenseData = useMemo(() => {
      return accountBalances
          .filter(a => a.type === AccountType.Expense && a.balance > 0)
          .map(a => ({ name: a.name, value: a.balance }));
  }, [accountBalances]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#ffc0cb'];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {[{
          title: 'Total Assets',
          value: financialSummary.assets,
          colorClass: 'text-debit'
        }, {
          title: 'Total Liabilities',
          value: financialSummary.liabilities,
          colorClass: 'text-credit'
        }, {
          title: 'Net Income',
          value: financialSummary.netIncome,
          colorClass: financialSummary.netIncome >= 0 ? 'text-debit' : 'text-credit',
          colSpan: 2
        }, {
          title: 'Owner\'s Equity',
          value: financialSummary.equity + financialSummary.netIncome,
          colorClass: 'text-zinc-100',
          colSpan: 2
        }].map((card, index) => {
          const [isVisible, setIsVisible] = useState(false);
          useEffect(() => {
            const timer = setTimeout(() => setIsVisible(true), index * 100);
            return () => clearTimeout(timer);
          }, [index]);

          return (
            <div
              key={card.title}
              className={`bg-zinc-900 p-5 rounded-lg border border-zinc-800 transition-opacity transition-transform duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${card.colSpan ? `col-span-${card.colSpan}` : ''}`}
            >
              <h3 className="text-base font-medium text-zinc-400">{card.title}</h3>
              <p className={`text-3xl font-semibold ${card.colorClass}`}>{formatCurrency(card.value)}</p>
            </div>
          );
        })}
      </div>

       <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Financial Position</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={balanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46"/>
                    <XAxis dataKey="name" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" tickFormatter={(value) => formatCurrency(value, { symbol: true })}/>
                    <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                    <Legend />
                    <Bar dataKey="value" fill="#818cf8" name={`Value in ${displayCurrency.code}`} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {expenseData.length > 0 && (
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-100 mb-4">Expense Breakdown</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {expenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Amount']}
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        )}

      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Trial Balance</h2>
        <div className="space-y-2">
             <div className="hidden sm:flex justify-between items-center text-sm text-zinc-400 px-3">
                <span className="flex-1">Account</span>
                <div className="flex font-mono w-48 text-right">
                    <span className="w-1/2">Debit</span>
                    <span className="w-1/2">Credit</span>
                </div>
            </div>
          {accountBalances.filter(a => a.balance !== 0).map(account => (
             <div key={account.id} className="bg-zinc-800 p-3 rounded-lg flex justify-between items-center text-base">
                <span className="text-zinc-300 flex-1 truncate pr-2">{account.name}</span>
                <div className="flex font-mono w-48 text-right shrink-0">
                    <span className="w-1/2 text-debit">
                    {[AccountType.Asset, AccountType.Expense].includes(account.type) && account.balance > 0 ? `${formatCurrency(account.balance)}` : ''}
                    </span>
                    <span className="w-1/2 text-credit">
                    {[AccountType.Liability, AccountType.Equity, AccountType.Revenue].includes(account.type) && account.balance > 0 ? `${formatCurrency(account.balance)}` : ''}
                    </span>
                </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-zinc-600 font-bold text-lg">
            <span className="text-zinc-100">Totals</span>
            <div className="flex font-mono w-48 text-right shrink-0">
                <span className="w-1/2 text-debit">{formatCurrency(totals.debits)}</span>
                <span className="w-1/2 text-credit">{formatCurrency(totals.credits)}</span>
            </div>
        </div>
         {Math.abs(totals.debits - totals.credits) > 0.001 &&
            <p className="text-center mt-4 p-2 bg-rose-900/50 text-rose-300 rounded-md">Warning: Debits and Credits do not balance!</p>
         }
      </div>

    </div>
  );
};

export default DashboardPage;
