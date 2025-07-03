
import React, { useState } from 'react';
import { Currency, Setting, SettingKey } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useDatabase } from '../hooks/useDatabase';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

export const CurrencyManager: React.FC = () => {
    const { currencies, defaultCurrency } = useCurrency();
    const { addCurrency, updateCurrency, deleteCurrency, setSetting } = useDatabase();
    
    const [newCurrency, setNewCurrency] = useState<Omit<Currency, 'id'>>({ name: '', code: '', symbol: '', exchangeRate: 1 });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editState, setEditState] = useState<Partial<Currency>>({});
    const [error, setError] = useState('');

    if (!defaultCurrency) {
        return (
            <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800 space-y-4">
                <h2 className="text-xl font-semibold text-zinc-100">Manage Currencies</h2>
                <p className="text-zinc-400 text-sm">Loading currency data...</p>
            </div>
        );
    }
    
    const handleAddCurrency = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newCurrency.name || !newCurrency.code || !newCurrency.symbol) {
            setError('All fields are required.');
            return;
        }
        try {
            await addCurrency(newCurrency);
            setNewCurrency({ name: '', code: '', symbol: '', exchangeRate: 1 });
        } catch (err) {
            setError((err as Error).message);
        }
    };
    
    const handleEditClick = (currency: Currency) => {
        setEditingId(currency.id);
        setEditState(currency);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editState) return;

        const finalState = { ...editState };
        // Always enforce that the default currency's exchange rate is 1.
        if (defaultCurrency?.id === editingId) {
            finalState.exchangeRate = 1;
        }

        await updateCurrency(editingId, finalState);
        
        setEditingId(null);
        setEditState({});
    };

    const handleDelete = async (id: number) => {
        if (id === defaultCurrency?.id) {
            alert("Cannot delete the default currency. Please set a different currency as default first.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this currency? This cannot be undone.")) {
            await deleteCurrency(id);
        }
    };

    return (
        <div className="bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-800 space-y-4">
            <h2 className="text-xl font-semibold text-zinc-100">Manage Currencies</h2>
            <p className="text-zinc-400 text-sm">Define currencies and their exchange rates relative to your default currency ({defaultCurrency?.code}). The rate indicates how many units of the default currency are needed to equal one unit of the foreign currency.</p>
            
            {/* Currency List */}
            <div className="space-y-2">
                {currencies.map(c => (
                    <div key={c.id} className="bg-zinc-800 p-3 rounded-lg flex flex-wrap items-center gap-4">
                        {editingId === c.id ? (
                            <>
                                <input value={editState.name || ''} onChange={e => setEditState({...editState, name: e.target.value})} placeholder="Name" className="bg-zinc-700 p-2 rounded w-1/4" />
                                <input value={editState.code || ''} onChange={e => setEditState({...editState, code: e.target.value?.toUpperCase()})} placeholder="Code" className="bg-zinc-700 p-2 rounded w-20" />
                                <input value={editState.symbol || ''} onChange={e => setEditState({...editState, symbol: e.target.value})} placeholder="Symbol" className="bg-zinc-700 p-2 rounded w-16" />
                                <input type="number" step="any" value={editState.exchangeRate ?? 1} onChange={e => setEditState({...editState, exchangeRate: parseFloat(e.target.value) || 0})} placeholder="Rate" className="bg-zinc-700 p-2 rounded w-24" disabled={c.id === defaultCurrency?.id}/>
                                <div className="flex-grow"></div>
                                <button onClick={handleSaveEdit} className="p-2 text-green-400 hover:text-green-300"><CheckIcon className="w-5 h-5"/></button>
                                <button onClick={() => setEditingId(null)} className="p-2 text-zinc-400 hover:text-white"><XIcon className="w-5 h-5"/></button>
                            </>
                        ) : (
                            <>
                                <div className="flex-grow">
                                    <span className="font-semibold text-lg text-white">{c.name} ({c.code})</span>
                                    <span className="text-zinc-400 ml-2">{c.symbol}</span>
                                </div>
                                <div className="text-zinc-300 font-mono text-sm whitespace-nowrap">
                                    { c.id === defaultCurrency?.id ? 'Default Currency' : `1 ${c.code} = ${c.exchangeRate} ${defaultCurrency?.code}` }
                                </div>
                                <button onClick={() => handleEditClick(c)} className="p-2 text-zinc-400 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(c.id)} className="p-2 text-zinc-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Currency Form */}
            <form onSubmit={handleAddCurrency} className="pt-4 border-t border-zinc-700 space-y-3">
                 <h3 className="text-lg font-semibold text-zinc-200">Add New Currency</h3>
                 {error && <p className="text-red-400 bg-red-900/50 p-2 rounded text-sm">{error}</p>}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-grow" style={{minWidth: '150px'}}>
                        <label className="text-sm text-zinc-400">Currency Name</label>
                        <input value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} placeholder="e.g., Euro" className="mt-1 w-full bg-zinc-700 p-2.5 rounded" />
                    </div>
                     <div className="w-24">
                        <label className="text-sm text-zinc-400">Code</label>
                        <input value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} placeholder="EUR" className="mt-1 w-full bg-zinc-700 p-2.5 rounded" />
                    </div>
                    <div className="w-20">
                        <label className="text-sm text-zinc-400">Symbol</label>
                        <input value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} placeholder="€" className="mt-1 w-full bg-zinc-700 p-2.5 rounded" />
                    </div>
                    <div className="w-32">
                        <label className="text-sm text-zinc-400">Rate vs {defaultCurrency?.code}</label>
                        <input type="number" step="any" min="0" value={newCurrency.exchangeRate} onChange={e => setNewCurrency({...newCurrency, exchangeRate: parseFloat(e.target.value) || 0})} placeholder="e.g. 1.1" className="mt-1 w-full bg-zinc-700 p-2.5 rounded" />
                    </div>
                    <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md flex items-center gap-2 h-[42px]"><PlusCircleIcon className="w-5 h-5"/> Add</button>
                </div>
            </form>
        </div>
    );
};