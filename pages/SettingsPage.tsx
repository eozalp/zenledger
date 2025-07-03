
import React, { useRef, useState, useEffect } from 'react';
import { exportData, importData, db } from '../db';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { AUTO_BACKUP_KEY } from '../constants';
import { useDatabase } from '../hooks/useDatabase';
import { FavoriteTransaction, SettingKey } from '../types';
import { TrashIcon } from '../components/icons/TrashIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { useFolderBackup } from '../contexts/FolderBackupContext';
import { FolderIcon } from '../components/icons/FolderIcon';
import { RotateCcwIcon } from '../components/icons/RotateCcwIcon';
import { useCurrency } from '../contexts/CurrencyContext';
import { CurrencyManager } from '../components/CurrencyManager';

const SettingsPage: React.FC<{ performImport: (jsonString: string, source: string) => Promise<void> }> = ({ performImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [backupInfo, setBackupInfo] = useState<{ date: string; size: number } | null>(null);
    const { favoriteTransactions, deleteFavoriteTransaction, setSetting, updateCurrency, settings } = useDatabase();
    const { currencies, defaultCurrency, displayCurrency } = useCurrency();

    useEffect(() => {
        const backupJson = localStorage.getItem(AUTO_BACKUP_KEY);
        if (backupJson) {
            try {
                const backupData = JSON.parse(backupJson);
                setBackupInfo({
                    date: backupData.backupDate,
                    size: backupJson.length,
                });
            } catch (e) {
                console.error("Could not parse auto-backup data", e);
                setBackupInfo(null);
            }
        }
    }, []);

    const handleExport = async () => {
        setMessage(null);
        try {
            const jsonString = await exportData();
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zenledger-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'Data exported successfully!' });
        } catch (error) {
            console.error('Export failed:', error);
            setMessage({ type: 'error', text: 'Failed to export data.' });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                setMessage({ type: 'error', text: 'Failed to read file.' });
                return;
            }

            const isConfirmed = window.confirm(
                'Are you sure you want to import this file? This will overwrite all existing data.'
            );
            if (isConfirmed) {
                await performImport(text, 'JSON file');
            }
        };
        reader.readAsText(file);
        if(event.target) event.target.value = '';
    };

    const handleRestoreFromBackup = () => {
        const backupJson = localStorage.getItem(AUTO_BACKUP_KEY);
        if (!backupJson) {
            setMessage({ type: 'error', text: 'No automatic backup found.' });
            return;
        }
        
        const isConfirmed = window.confirm(
            'Are you sure you want to restore from the automatic backup? This will overwrite all current data.'
        );
        if (isConfirmed) {
            const dataToImport = JSON.parse(backupJson);
            performImport(JSON.stringify(dataToImport), 'automatic backup');
        }
    }

    const handleResetApp = async () => {
        if (window.confirm("Are you absolutely sure you want to reset the app? All data will be permanently deleted.")) {
            try {
                await db.delete();
                setMessage({ type: 'success', text: 'App has been reset. The page will now reload.' });
                setTimeout(() => {
                    window.location.reload();
                }, 2500);
            } catch (error) {
                console.error('Failed to reset app:', error);
                setMessage({ type: 'error', text: 'Failed to reset app.' });
            }
        }
    };
    
    const handleDefaultCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDefaultId = parseInt(e.target.value);
        if (window.confirm("Changing the default currency is a major operation. You must manually update all other currency exchange rates to be relative to the new default. Are you sure you want to proceed?")) {
            const newDefaultCurrency = currencies.find(c => c.id === newDefaultId);
            if (defaultCurrency && newDefaultCurrency) {
                 await updateCurrency(newDefaultCurrency.id, { exchangeRate: 1 });
            }
            await setSetting({ key: SettingKey.DefaultCurrencyId, value: newDefaultId });
            setMessage({type: 'success', text: 'Default currency updated. Please review all other exchange rates now.'})
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-zinc-100">Settings</h1>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {message.text}
                </div>
            )}
            
            <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800 space-y-4">
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">Currency Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="defaultCurrency" className="block text-sm font-medium text-zinc-300">Default Currency (for storage)</label>
                         <select id="defaultCurrency" value={defaultCurrency?.id || ''} onChange={handleDefaultCurrencyChange} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3">
                            {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="displayCurrency" className="block text-sm font-medium text-zinc-300">Display Currency (for UI)</label>
                        <select id="displayCurrency" value={displayCurrency?.id || ''} onChange={e => setSetting({key: SettingKey.DisplayCurrencyId, value: parseInt(e.target.value)})} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3">
                            {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="defaultEntryCurrency" className="block text-sm font-medium text-zinc-300">Default Entry Currency</label>
                        <select id="defaultEntryCurrency" value={settings?.find(s => s.key === SettingKey.DefaultEntryCurrencyId)?.value || ''} onChange={e => setSetting({key: SettingKey.DefaultEntryCurrencyId, value: parseInt(e.target.value)})} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3">
                            {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <CurrencyManager />

            <FolderBackupManager />

            <FolderRestoreManager performImport={performImport} />

            <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">Backup</h2>
                <p className="text-zinc-400 mb-4 text-sm">Create backups of your data.</p>
                <div className="space-y-4">
                    <button onClick={handleExport} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        <DownloadIcon className="w-6 h-6"/>
                        Export to JSON
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">Restore</h2>
                <p className="text-zinc-400 mb-4 text-sm">Restore your data from a backup file.</p>
                <div className="space-y-4">
                    <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold text-zinc-100 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">
                        <UploadIcon className="w-6 h-6"/>
                        Import from JSON
                    </button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                    {backupInfo && (
                        <button onClick={handleRestoreFromBackup} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold text-zinc-100 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">
                            <RotateCcwIcon className="w-6 h-6"/>
                            Restore from Browser Backup
                        </button>
                    )}
                </div>
            </div>

            {favoriteTransactions && <FavoriteManager favorites={favoriteTransactions} deleteFavorite={deleteFavoriteTransaction}/>}

            <div className="bg-rose-900/50 p-5 sm:p-6 rounded-lg border border-rose-800">
                <h2 className="text-xl font-semibold text-rose-200 mb-2">Danger Zone</h2>
                <p className="text-rose-300/80 mb-4 text-sm">
                    This action is irreversible and will permanently delete all your accounts, transactions, and settings.
                </p>
                <button onClick={handleResetApp} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors">
                    <TrashIcon className="w-6 h-6"/>
                    Reset App
                </button>
            </div>
        </div>
    );
};

const FavoriteManager: React.FC<{favorites: FavoriteTransaction[], deleteFavorite: (id: number) => Promise<void>}> = ({ favorites, deleteFavorite }) => {
    return (
        <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Favorite Transactions</h2>
            <p className="text-zinc-400 mb-4 text-sm">
                Manage your shortcuts for frequently entered transactions. To add a new favorite, use the "Save as Favorite" option when creating an expense or revenue entry.
            </p>
            {favorites.length > 0 ? (
                <ul className="space-y-3">
                    {favorites.map(fav => (
                        <li key={fav.id} className="bg-zinc-800 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <StarIcon className="w-6 h-6 text-amber-400" />
                                <span className="text-zinc-200 font-medium text-lg">{fav.name}</span>
                            </div>
                            <button onClick={() => deleteFavorite(fav.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-1">
                                <TrashIcon className="w-6 h-6" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-zinc-500 p-4 bg-zinc-800 rounded-md">No favorites saved yet.</p>
            )}
        </div>
    )
}

const FolderBackupManager: React.FC = () => {
    const { 
        isSupported, 
        selectFolder, 
        forgetFolder, 
        folderName, 
        status, 
        error,
        forceBackup
    } = useFolderBackup();

    return (
        <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Diff-based Folder Backup</h2>
            <p className="text-zinc-400 mb-4 text-sm">
                Automatically save backups to a folder on your device. This provides a robust, versioned history of your data.
            </p>
            {!isSupported ? (
                <p className="text-center text-amber-400 p-4 bg-amber-900/50 rounded-md">
                    Your browser does not support this feature. Please use a modern browser like Chrome or Edge.
                </p>
            ) : folderName ? (
                <div className="bg-zinc-800 p-4 rounded-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <p className="font-medium text-zinc-200">Backups saving to:</p>
                            <div className="flex items-center gap-2 mt-1">
                                <FolderIcon className="w-5 h-5 text-indigo-400 shrink-0"/>
                                <span className="text-sm text-zinc-300 font-mono break-all">{folderName}</span>
                            </div>
                        </div>
                        <button onClick={() => {if(window.confirm("Are you sure you want to forget this folder? This will not delete the backup file, but the app will no longer have access to it.")) {forgetFolder()}}} className="px-5 py-2.5 text-base font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 w-full sm:w-auto shrink-0">Forget</button>
                        <button onClick={forceBackup} className="px-5 py-2.5 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 w-full sm:w-auto shrink-0 flex items-center gap-2"><UploadIcon className="w-5 h-5"/>Backup Now</button>
                    </div>
                    {(status !== 'idle' || error) && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                            <p className="text-sm text-zinc-400">
                                Status: <span className={`font-medium ${status === 'error' || error ? 'text-red-400' : 'text-zinc-300'}`}>
                                    {error ? `Error: ${error}` : 
                                        {
                                            saving: 'Saving backup...',
                                            saved: `Up to date. Last saved just now.`,
                                            error: `Error: ${error}`,
                                            'permission-required': 'Permission required to access folder.'
                                        }[status]
                                    }
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={selectFolder} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                    <FolderIcon className="w-6 h-6"/>
                    Set Backup Folder
                </button>
            )}
        </div>
    );
};



const FolderRestoreManager: React.FC<{ performImport: (jsonString: string, source: string) => Promise<void> }> = ({ performImport }) => {
    const { isSupported, selectFileForRestore } = useFolderBackup();

    const handleRestore = async () => {
        const contents = await selectFileForRestore();
        if (contents) {
            if (window.confirm("Are you sure you want to restore from this file? This will overwrite all current data.")) {
                await performImport(contents, "file system");
            }
        }
    };

    if (!isSupported) return null;

    return (
        <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Restore from File</h2>
            <p className="text-zinc-400 mb-4 text-sm">
                Select a ZenLedger backup file from your device to restore your data.
            </p>
            <button onClick={handleRestore} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                <RotateCcwIcon className="w-6 h-6"/>
                Select File to Restore
            </button>
        </div>
    );
};

export default SettingsPage;
