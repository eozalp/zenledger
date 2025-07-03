
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db } from '../db';
import { useDatabase } from '../hooks/useDatabase';
import { FOLDER_HANDLE_KEY } from '../constants';

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

const isSupported = 'showDirectoryPicker' in window;

interface FolderBackupContextType {
    isSupported: boolean;
    selectFolder: () => Promise<void>;
    forgetFolder: () => Promise<void>;
    folderName: string | null;
    status: 'idle' | 'saving' | 'saved' | 'error' | 'permission-required';
    error: string | null;
    forceBackup: () => Promise<void>;
    folderHandle: any | null;
    selectFileForRestore: () => Promise<string | null>;
}

const FolderBackupContext = createContext<FolderBackupContextType | undefined>(undefined);

export const useFolderBackup = () => {
    const context = useContext(FolderBackupContext);
    if (!context) {
        throw new Error('useFolderBackup must be used within a FolderBackupProvider');
    }
    return context;
};

interface FolderBackupProviderProps {
    children: ReactNode;
    dbState: ReturnType<typeof useDatabase>;
}

export const FolderBackupProvider: React.FC<FolderBackupProviderProps> = ({ children, dbState }) => {
    const { accounts, transactions, favoriteTransactions, currencies, settings } = dbState;
    const [folderHandle, setFolderHandle] = useState<any | null>(null);
    const [folderName, setFolderName] = useState<string | null>(null);
    const [status, setStatus] = useState<FolderBackupContextType['status']>('idle');
    const [error, setError] = useState<string | null>(null);

    const getHandleFromDB = useCallback(async () => {
        try {
            const setting = await db.settings.get(FOLDER_HANDLE_KEY);
            if (setting && setting.value) {
                const handle = setting.value as any;
                setFolderHandle(handle);
                setFolderName(handle.name);
                return handle;
            }
        } catch (e) {
            console.error("Error reading folder handle from DB", e);
        }
        return null;
    }, []);
    
    useEffect(() => {
        if (!isSupported) return;
        getHandleFromDB();
    }, [getHandleFromDB]);

    const verifyPermission = useCallback(async (handle: any): Promise<boolean> => {
        const options = { mode: 'readwrite' as const };
        if ((await (handle as any).queryPermission(options)) === 'granted') {
            return true;
        }
        if ((await (handle as any).requestPermission(options)) === 'granted') {
            return true;
        }
        setStatus('permission-required');
        setError('Permission denied for backup folder.');
        setFolderHandle(null); // Force user to re-select
        await db.settings.delete(FOLDER_HANDLE_KEY);
        setFolderName(null);
        return false;
    }, []);

    const saveBackup = useCallback(async (handle: any) => {
        if (!accounts || !transactions || !favoriteTransactions || !currencies || !settings) return;
        
        setStatus('saving');
        const hasPermission = await verifyPermission(handle);
        if (!hasPermission) return;

        try {
            const dataToSave = {
                backupDate: new Date().toISOString(),
                accounts,
                transactions,
                favoriteTransactions,
                currencies,
                settings
            };
            const jsonString = JSON.stringify(dataToSave, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            const filename = `zenledger-main-backup.json`;

            const fileHandle = await handle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            setStatus('saved');
            setError(null);
            console.log(`Backup saved to ${filename} in ${handle.name}`);
        } catch (err) {
            console.error('Failed to save backup:', err);
            setStatus('error');
            setError('Failed to write backup file. The folder may have been moved or deleted. Please set it again.');
            setFolderHandle(null);
            await db.settings.delete(FOLDER_HANDLE_KEY);
            setFolderName(null);
        }
    }, [accounts, transactions, favoriteTransactions, currencies, settings, verifyPermission]);

    const debouncedSaveBackup = useCallback(debounce(saveBackup, 5000), [saveBackup]);

    useEffect(() => {
        if (folderHandle && accounts && transactions && favoriteTransactions && currencies && settings) {
            if (accounts.length > 0 || transactions.length > 0 || favoriteTransactions.length > 0) {
                 debouncedSaveBackup(folderHandle);
            }
        }
    }, [accounts, transactions, favoriteTransactions, currencies, settings, folderHandle, debouncedSaveBackup]);
    
    const selectFolder = async () => {
        if (!isSupported) return;
        try {
            const handle = await (window as any).showDirectoryPicker();
            await db.settings.put({ key: FOLDER_HANDLE_KEY, value: handle });
            setFolderHandle(handle);
            setFolderName(handle.name);
            setStatus('idle');
            setError(null);
        } catch (err) {
            console.error('User cancelled folder selection or an error occurred.', err);
        }
    };

    const forgetFolder = async () => {
        if (!isSupported) return;
        await db.settings.delete(FOLDER_HANDLE_KEY);
        setFolderHandle(null);
        setFolderName(null);
        setStatus('idle');
        setError(null);
    };

    const forceBackup = async () => {
        if (folderHandle) {
            await saveBackup(folderHandle);
        }
    };

    const selectFileForRestore = async (): Promise<string | null> => {
        if (!isSupported) return null;
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json'],
                    },
                }],
                multiple: false,
            });
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (err) {
            console.error('User cancelled file selection or an error occurred.', err);
            return null;
        }
    };

    const value = { isSupported, selectFolder, forgetFolder, folderName, status, error, forceBackup, folderHandle, selectFileForRestore };

    return <FolderBackupContext.Provider value={value}>{children}</FolderBackupContext.Provider>;
};
