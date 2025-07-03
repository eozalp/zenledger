
import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import { useDatabase } from './hooks/useDatabase';
import { useAutoBackup } from './hooks/useAutoBackup';
import { FolderBackupProvider } from './contexts/FolderBackupContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { importData } from './db';

const App: React.FC = () => {
  const dbState = useDatabase();
  const location = useLocation();
  
  // This hook will automatically backup data to localStorage on changes
  useAutoBackup(dbState.accounts, dbState.transactions, dbState.favoriteTransactions, dbState.currencies, dbState.settings);
  
  const performImport = async (jsonString: string, source: string) => {
      try {
          await importData(jsonString);
          alert(`Data imported successfully from ${source}! The page will now reload.`);
          window.location.reload();
      } catch (error) {
          console.error('Import failed:', error);
          alert(`Failed to import data from ${source}. The file might be corrupted or in the wrong format.`);
      }
  };

  return (
    <CurrencyProvider>
      <FolderBackupProvider dbState={dbState} performImport={performImport}>
        <Layout db={dbState}>
          <TransitionGroup component={null}>
            <CSSTransition key={location.key} classNames="page" timeout={300}>
              <Routes location={location}>
                <Route path="/" element={<DashboardPage db={dbState} />} />
                <Route path="/accounts" element={<AccountsPage db={dbState} />} />
                <Route path="/transactions" element={<TransactionsPage db={dbState} />} />
                <Route path="/settings" element={<SettingsPage performImport={performImport} />} />
              </Routes>
            </CSSTransition>
          </TransitionGroup>
        </Layout>
      </FolderBackupProvider>
    </CurrencyProvider>
  );
};

export default App;
