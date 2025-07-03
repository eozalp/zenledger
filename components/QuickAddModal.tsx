
import React, { useState, useMemo, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useDatabase } from '../hooks/useDatabase';
import { Account, AccountType, JournalEntryLine, FavoriteTransaction, FavoriteTransactionType, SettingKey } from '../types';
import { XIcon } from './icons/XIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { StarIcon } from './icons/StarIcon';
import { CameraIcon } from './icons/CameraIcon';
import { TrashIcon } from './icons/TrashIcon';
import { resizeAndEncodeImage } from '../hooks/image';
import { SearchableSelect } from './SearchableSelect';
import { useCurrency } from '../contexts/CurrencyContext';

interface QuickAddModalProps {
  db: ReturnType<typeof useDatabase>;
  onClose: () => void;
  isOpen: boolean;
}

type View = 'main' | 'expense' | 'revenue' | 'transfer' | 'favoriteEntry' | 'borrow' | 'lend' | 'custom';

const QuickAddModal: React.FC<QuickAddModalProps> = ({ db, onClose }) => {
  const { accounts, addTransaction, favoriteTransactions, addFavoriteTransaction, settings } = db;
  const { currencies, defaultCurrency, displayCurrency, convert } = useCurrency();
  const [view, setView] = useState<View>('main');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [inputCurrencyId, setInputCurrencyId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryAccountId, setCategoryAccountId] = useState<string>('');
  const [activeFavorite, setActiveFavorite] = useState<FavoriteTransaction | null>(null);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Favorite creation state
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  
  React.useEffect(() => {
    const defaultEntryCurrencyId = settings?.find(s => s.key === SettingKey.DefaultEntryCurrencyId)?.value;
    if (defaultEntryCurrencyId) {
        setInputCurrencyId(String(defaultEntryCurrencyId));
    } else if (displayCurrency) {
        setInputCurrencyId(String(displayCurrency.id));
    }
  }, [displayCurrency, settings]);

  const resetForm = () => {
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setFromAccountId('');
      setToAccountId('');
      setCategoryAccountId('');
      setError('');
      setActiveFavorite(null);
      setSaveAsFavorite(false);
      setFavoriteName('');
      setAttachment(null);
      setIsProcessingImage(false);
      setFocusedField(null);
      const defaultEntryCurrencyId = settings?.find(s => s.key === SettingKey.DefaultEntryCurrencyId)?.value;
      if (defaultEntryCurrencyId) {
          setInputCurrencyId(String(defaultEntryCurrencyId));
      } else if (displayCurrency) {
          setInputCurrencyId(String(displayCurrency.id));
      }
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    resetForm();
    setView('main');
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError('');
      setIsProcessingImage(true);
      try {
          const resizedDataUrl = await resizeAndEncodeImage(file);
          setAttachment(resizedDataUrl);
      } catch (err) {
          console.error('Image processing failed:', err);
          setError('Failed to process image. It might be corrupted or in an unsupported format.');
      } finally {
          setIsProcessingImage(false);
          if(event.target) event.target.value = '';
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!db.accounts || !db.addTransaction || !defaultCurrency) return;

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
          setError('Please enter a valid, positive amount.');
          return;
      }
      
      const amountInDefaultCurrency = convert(numericAmount, Number(inputCurrencyId), defaultCurrency.id);

      let lines: JournalEntryLine[] = [];
      let entryDescription = description;
      let transactionAttachment = attachment || undefined;

      if (view === 'expense') {
          if (!fromAccountId || !categoryAccountId) {
              setError('Please select both a payment source and an expense category.');
              return;
          }
          if(saveAsFavorite && !favoriteName.trim()){
              setError("Please enter a name for your new favorite.");
              return;
          }
          entryDescription = description || `Expense: ${db.accounts.find(a => a.id === parseInt(categoryAccountId))?.name}`;
          lines = [
              { accountId: parseInt(fromAccountId), debit: 0, credit: amountInDefaultCurrency }, // Credit asset
              { accountId: parseInt(categoryAccountId), debit: amountInDefaultCurrency, credit: 0 }, // Debit expense
          ];
          if(saveAsFavorite && favoriteName.trim() && addFavoriteTransaction){
              await addFavoriteTransaction({
                  name: favoriteName.trim(),
                  type: FavoriteTransactionType.Expense,
                  fromAccountId: parseInt(fromAccountId),
                  categoryAccountId: parseInt(categoryAccountId),
                  defaultDescription: description,
              });
          }
      } else if (view === 'revenue') {
          if (!toAccountId || !categoryAccountId) {
              setError('Please select both a deposit account and a revenue category.');
              return;
          }
           if(saveAsFavorite && !favoriteName.trim()){
              setError("Please enter a name for your new favorite.");
              return;
          }
          entryDescription = description || `Revenue: ${db.accounts.find(a => a.id === parseInt(categoryAccountId))?.name}`;
          lines = [
              { accountId: parseInt(toAccountId), debit: amountInDefaultCurrency, credit: 0 }, // Debit asset
              { accountId: parseInt(categoryAccountId), debit: 0, credit: amountInDefaultCurrency }, // Credit revenue
          ];
          if(saveAsFavorite && favoriteName.trim() && addFavoriteTransaction){
              await addFavoriteTransaction({
                  name: favoriteName.trim(),
                  type: FavoriteTransactionType.Revenue,
                  toAccountId: parseInt(toAccountId),
                  categoryAccountId: parseInt(categoryAccountId),
                  defaultDescription: description,
              });
          }
      } else if (view === 'transfer') {
          if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
              setError('Please select two different accounts for the transfer.');
              return;
            }
          entryDescription = description || `Transfer from ${db.accounts.find(a => a.id === parseInt(fromAccountId))?.name} to ${db.accounts.find(a => a.id === parseInt(toAccountId))?.name}`;
          lines = [
              { accountId: parseInt(fromAccountId), debit: 0, credit: amountInDefaultCurrency },
              { accountId: parseInt(toAccountId), debit: amountInDefaultCurrency, credit: 0 },
          ];
      } else if (view === 'borrow') {
          if (!toAccountId || !categoryAccountId) {
              setError('Please select both a deposit account and a loan account.');
              return;
          }
          if(saveAsFavorite && !favoriteName.trim()){
              setError("Please enter a name for your new favorite.");
              return;
          }
          entryDescription = description || `Borrowed from ${db.accounts.find(a => a.id === parseInt(categoryAccountId))?.name}`;
          lines = [
              { accountId: parseInt(toAccountId), debit: amountInDefaultCurrency, credit: 0 }, // Debit asset
              { accountId: parseInt(categoryAccountId), debit: 0, credit: amountInDefaultCurrency }, // Credit liability
          ];
          if(saveAsFavorite && favoriteName.trim() && addFavoriteTransaction){
              await addFavoriteTransaction({
                  name: favoriteName.trim(),
                  type: FavoriteTransactionType.Borrow,
                  toAccountId: parseInt(toAccountId),
                  categoryAccountId: parseInt(categoryAccountId),
                  defaultDescription: description,
              });
          }
      } else if (view === 'lend') {
          if (!fromAccountId || !categoryAccountId) {
              setError('Please select both a source account and a receivable account.');
              return;
          }
          if(saveAsFavorite && !favoriteName.trim()){
              setError("Please enter a name for your new favorite.");
              return;
          }
          entryDescription = description || `Loan to ${db.accounts.find(a => a.id === parseInt(categoryAccountId))?.name}`;
          lines = [
              { accountId: parseInt(fromAccountId), debit: 0, credit: amountInDefaultCurrency }, // Credit asset
              { accountId: parseInt(categoryAccountId), debit: amountInDefaultCurrency, credit: 0 }, // Debit asset (receivable)
          ];
          if(saveAsFavorite && favoriteName.trim() && addFavoriteTransaction){
              await addFavoriteTransaction({
                  name: favoriteName.trim(),
                  type: FavoriteTransactionType.Lend,
                  fromAccountId: parseInt(fromAccountId),
                  categoryAccountId: parseInt(categoryAccountId),
                  defaultDescription: description,
              });
          }
      } else if (view === 'custom') {
          if (!fromAccountId || !toAccountId) {
              setError('Please select both a debit and a credit account.');
              return;
          }
          entryDescription = description || `Custom Entry: ${db.accounts.find(a => a.id === parseInt(fromAccountId))?.name} to ${db.accounts.find(a => a.id === parseInt(toAccountId))?.name}`;
          lines = [
              { accountId: parseInt(fromAccountId), debit: amountInDefaultCurrency, credit: 0 }, // Debit
              { accountId: parseInt(toAccountId), debit: 0, credit: amountInDefaultCurrency }, // Credit
          ];
      } else if (view === 'favoriteEntry' && activeFavorite) {
          entryDescription = description || activeFavorite.defaultDescription || activeFavorite.name;
          if(activeFavorite.type === FavoriteTransactionType.Expense){
            if (activeFavorite.fromAccountId === undefined) {
                setError('Invalid favorite transaction: Missing source account for expense.');
                return;
            }
            lines = [
                { accountId: activeFavorite.fromAccountId, debit: 0, credit: amountInDefaultCurrency },
                { accountId: activeFavorite.categoryAccountId, debit: amountInDefaultCurrency, credit: 0 },
            ];
          } else if (activeFavorite.type === FavoriteTransactionType.Revenue) {
            if (activeFavorite.toAccountId === undefined) {
                setError('Invalid favorite transaction: Missing deposit account for revenue.');
                return;
            }
            lines = [
                { accountId: activeFavorite.toAccountId, debit: amountInDefaultCurrency, credit: 0 },
                { accountId: activeFavorite.categoryAccountId, debit: 0, credit: amountInDefaultCurrency },
            ];
          } else if (activeFavorite.type === FavoriteTransactionType.Borrow) {
            if (activeFavorite.toAccountId === undefined) {
                setError('Invalid favorite transaction: Missing deposit account for borrowing.');
                return;
            }
            lines = [
                { accountId: activeFavorite.toAccountId, debit: amountInDefaultCurrency, credit: 0 },
                { accountId: activeFavorite.categoryAccountId, debit: 0, credit: amountInDefaultCurrency },
            ];
          } else if (activeFavorite.type === FavoriteTransactionType.Lend) {
            if (activeFavorite.fromAccountId === undefined) {
                setError('Invalid favorite transaction: Missing source account for lending.');
                return;
            }
             lines = [
                { accountId: activeFavorite.fromAccountId, debit: 0, credit: amountInDefaultCurrency },
                { accountId: activeFavorite.categoryAccountId, debit: amountInDefaultCurrency, credit: 0 },
            ];
          }
      }


      if (lines.length > 0) {
          try {
              await db.addTransaction({ date, description: entryDescription, lines, attachment: transactionAttachment });
              handleSuccess(`Transaction saved: ${entryDescription}`);
          } catch(err) {
              setError((err as Error).message);
          }
      }
  };

  const handleFavoriteClick = (fav: FavoriteTransaction) => {
    setActiveFavorite(fav);
    setDescription(fav.defaultDescription || '');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setError('');
    setView('favoriteEntry');
  }

  const renderForm = (title: string, fields: React.ReactNode, backTo: View = 'main') => (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <div className="p-4 border-b border-zinc-700 flex-shrink-0">
             {!focusedField && <button type="button" onClick={() => { setView(backTo); resetForm(); }} className="text-indigo-400 text-base mb-2">&larr; Back to menu</button>}
            <h2 className="text-2xl font-bold text-zinc-100">{title}</h2>
        </div>
        <div ref={scrollContainerRef} className={`p-4 overflow-y-auto flex-grow ${focusedField ? '' : 'space-y-4'}`}>
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg text-sm">{error}</p>}
            {fields}
        </div>
        {!focusedField && 
          <div className="p-4 border-t border-zinc-700 flex-shrink-0">
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 text-xl rounded-lg hover:bg-indigo-700 disabled:bg-zinc-600 transition-colors">
                  Save Transaction
              </button>
          </div>
        }
    </form>
  );

  const selectedCurrency = useMemo(() => currencies.find(c => c.id === Number(inputCurrencyId)), [currencies, inputCurrencyId]);

  const amountField = (
    <div>
        <label className="text-base font-medium text-zinc-400">Amount</label>
        <div className="flex items-stretch gap-2 mt-1">
            <div className="relative flex-grow">
                <span className="absolute left-4 inset-y-0 flex items-center text-zinc-400 text-3xl">{selectedCurrency?.symbol || '$'}</span>
                <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                    onFocus={handleFocus}
                    className="w-full h-full bg-zinc-700 text-white text-5xl font-bold p-4 pl-12 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0"
                    placeholder="0.00" required autoFocus/>
            </div>
            <select
                value={inputCurrencyId}
                onChange={e => setInputCurrencyId(e.target.value)}
                className="bg-zinc-700 text-white font-semibold p-4 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0 text-2xl"
            >
                {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
        </div>
    </div>
  );

  const detailFields = (
      <>
        <div>
            <label htmlFor="description" className="text-base font-medium text-zinc-400">Description (Optional)</label>
            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)}
                onFocus={handleFocus}
                className="mt-1 w-full bg-zinc-700 p-4 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0 text-lg"
                placeholder="e.g., Dinner with client" />
        </div>
        <div>
            <label htmlFor="date" className="text-base font-medium text-zinc-400">Date</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)}
                onFocus={handleFocus}
                className="mt-1 w-full bg-zinc-700 p-4 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0 text-lg" required />
        </div>
        <div>
            <label className="text-base font-medium text-zinc-400">Attachment (Optional)</label>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            {attachment ? (
                <div className="mt-2 relative w-32 h-32">
                    <img src={attachment} alt="Attachment preview" className="rounded-lg w-full h-full object-cover" />
                    <button type="button" onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isProcessingImage} className="mt-1 w-full flex items-center justify-center gap-2 p-4 bg-zinc-700 rounded-lg border-2 border-dashed border-zinc-600 hover:border-indigo-500 transition-colors disabled:opacity-50">
                    <CameraIcon className="w-6 h-6"/>
                    <span className="text-lg">{isProcessingImage ? 'Processing...' : 'Take Photo'}</span>
                </button>
            )}
        </div>
    </>
  );
  
  const accountsByType = (types: AccountType[]) => (accounts?.filter(a => types.includes(a.type)) || []).map(a => ({ value: a.id, label: a.name }));
  
  const renderContent = () => {
    switch(view) {
        case 'favoriteEntry':
            return renderForm(`Quick Entry: ${activeFavorite?.name}`, <> {amountField} {detailFields} </>);
        case 'expense':
            return renderForm('Record an Expense', <>
                {!focusedField && amountField}

                {(!focusedField || focusedField === 'fromAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Paid From</label>
                        <SearchableSelect
                            value={fromAccountId}
                            onChange={(val) => setFromAccountId(String(val))}
                            placeholder="Select source account..."
                            options={accountsByType([AccountType.Asset])}
                            onOpen={() => setFocusedField('fromAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {(!focusedField || focusedField === 'categoryAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Expense Category</label>
                        <SearchableSelect
                            value={categoryAccountId}
                            onChange={(val) => setCategoryAccountId(String(val))}
                            placeholder="Select expense category..."
                            options={accountsByType([AccountType.Expense])}
                            onOpen={() => setFocusedField('categoryAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {!focusedField && detailFields}
                
                {!focusedField &&
                    <div className="pt-2 space-y-3">
                        <label className="flex items-center gap-3 text-base text-zinc-300 cursor-pointer p-1">
                            <input type="checkbox" checked={saveAsFavorite} onChange={e => setSaveAsFavorite(e.target.checked)} className="w-5 h-5 rounded text-indigo-500 bg-zinc-600 border-zinc-500 focus:ring-indigo-600"/>
                            Save as Favorite
                        </label>
                        {saveAsFavorite && (
                            <input type="text" value={favoriteName} onFocus={handleFocus} onChange={e => setFavoriteName(e.target.value)} placeholder="Favorite Name (e.g., 'Buy Coffee')" className="w-full bg-zinc-700 p-4 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0 text-lg" required/>
                        )}
                    </div>
                }
            </>);
        case 'revenue':
            return renderForm('Record Revenue', <>
                {!focusedField && amountField}

                {(!focusedField || focusedField === 'toAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Deposit To</label>
                        <SearchableSelect
                            value={toAccountId}
                            onChange={(val) => setToAccountId(String(val))}
                            placeholder="Select deposit account..."
                            options={accountsByType([AccountType.Asset])}
                            onOpen={() => setFocusedField('toAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {(!focusedField || focusedField === 'categoryAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Revenue Category</label>
                        <SearchableSelect
                            value={categoryAccountId}
                            onChange={(val) => setCategoryAccountId(String(val))}
                            placeholder="Select revenue category..."
                            options={accountsByType([AccountType.Revenue])}
                            onOpen={() => setFocusedField('categoryAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }
                
                {!focusedField && detailFields}

                {!focusedField &&
                    <div className="pt-2 space-y-3">
                        <label className="flex items-center gap-3 text-base text-zinc-300 cursor-pointer p-1">
                            <input type="checkbox" checked={saveAsFavorite} onChange={e => setSaveAsFavorite(e.target.checked)} className="w-5 h-5 rounded text-indigo-500 bg-zinc-600 border-zinc-500 focus:ring-indigo-600"/>
                            Save as Favorite
                        </label>
                        {saveAsFavorite && (
                            <input type="text" value={favoriteName} onFocus={handleFocus} onChange={e => setFavoriteName(e.target.value)} placeholder="Favorite Name (e.g., 'Client Payment')" className="w-full bg-zinc-700 p-4 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0 text-lg" required/>
                        )}
                    </div>
                }
            </>);
        case 'transfer':
             return renderForm('Transfer Money', <>
                {!focusedField && amountField}
                
                {(!focusedField || focusedField === 'fromAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Transfer From</label>
                        <SearchableSelect
                            value={fromAccountId}
                            onChange={(val) => setFromAccountId(String(val))}
                            placeholder="Select source account..."
                            options={accountsByType([AccountType.Asset, AccountType.Liability])}
                            onOpen={() => setFocusedField('fromAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {(!focusedField || focusedField === 'toAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Transfer To</label>
                        <SearchableSelect
                            value={toAccountId}
                            onChange={(val) => setToAccountId(String(val))}
                            placeholder="Select destination account..."
                            options={accountsByType([AccountType.Asset, AccountType.Liability])}
                            onOpen={() => setFocusedField('toAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {!focusedField && detailFields}
            </>);
        case 'borrow':
            return renderForm('Borrow Money', <>
                {!focusedField && amountField}

                {(!focusedField || focusedField === 'toAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Deposit To</label>
                        <SearchableSelect
                            value={toAccountId}
                            onChange={(val) => setToAccountId(String(val))}
                            placeholder="Select deposit account..."
                            options={accountsByType([AccountType.Asset])}
                            onOpen={() => setFocusedField('toAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }
                
                {(!focusedField || focusedField === 'categoryAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Loan Account</label>
                        <SearchableSelect
                            value={categoryAccountId}
                            onChange={(val) => setCategoryAccountId(String(val))}
                            placeholder="Select liability account..."
                            options={accountsByType([AccountType.Liability])}
                            onOpen={() => setFocusedField('categoryAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {!focusedField && detailFields}

                {!focusedField &&
                    <div className="pt-2 space-y-3">
                        <label className="flex items-center gap-3 text-base text-zinc-300 cursor-pointer p-1">
                            <input type="checkbox" checked={saveAsFavorite} onChange={e => setSaveAsFavorite(e.target.checked)} className="w-5 h-5 rounded text-indigo-500 bg-zinc-600 border-zinc-500 focus:ring-indigo-600"/>
                            Save as Favorite
                        </label>
                        {saveAsFavorite && (
                            <input type="text" value={favoriteName} onFocus={handleFocus} onChange={e => setFavoriteName(e.target.value)} placeholder="Favorite Name (e.g., 'Bank Loan')" className="w-full bg-zinc-700 p-4 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0 text-lg" required/>
                        )}
                    </div>
                }
            </>);
        case 'lend':
            return renderForm('Lend Money', <>
                {!focusedField && amountField}
                
                {(!focusedField || focusedField === 'fromAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Lend From</label>
                        <SearchableSelect
                            value={fromAccountId}
                            onChange={(val) => setFromAccountId(String(val))}
                            placeholder="Select source account..."
                            options={accountsByType([AccountType.Asset])}
                            onOpen={() => setFocusedField('fromAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {(!focusedField || focusedField === 'categoryAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Receivable Account</label>
                        <SearchableSelect
                            value={categoryAccountId}
                            onChange={(val) => setCategoryAccountId(String(val))}
                            placeholder="Select receivable account..."
                            options={accountsByType([AccountType.Asset])}
                            onOpen={() => setFocusedField('categoryAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {!focusedField && detailFields}

                {!focusedField &&
                    <div className="pt-2 space-y-3">
                        <label className="flex items-center gap-3 text-base text-zinc-300 cursor-pointer p-1">
                            <input type="checkbox" checked={saveAsFavorite} onChange={e => setSaveAsFavorite(e.target.checked)} className="w-5 h-5 rounded text-indigo-500 bg-zinc-600 border-zinc-500 focus:ring-indigo-600"/>
                            Save as Favorite
                        </label>
                        {saveAsFavorite && (
                            <input type="text" value={favoriteName} onFocus={handleFocus} onChange={e => setFavoriteName(e.target.value)} placeholder="Favorite Name (e.g., 'Loan to John')" className="w-full bg-zinc-700 p-4 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:ring-0 text-lg" required/>
                        )}
                    </div>
                }
            </>);
        case 'custom':
            return renderForm('Custom Entry', <>
                {!focusedField && amountField}
                
                {(!focusedField || focusedField === 'fromAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Debit Account</label>
                        <SearchableSelect
                            value={fromAccountId}
                            onChange={(val) => setFromAccountId(String(val))}
                            placeholder="Select debit account..."
                            options={accounts?.map(a => ({ value: a.id, label: a.name })) || []}
                            onOpen={() => setFocusedField('fromAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {(!focusedField || focusedField === 'toAccount') &&
                    <div>
                        <label className="text-base font-medium text-zinc-400">Credit Account</label>
                        <SearchableSelect
                            value={toAccountId}
                            onChange={(val) => setToAccountId(String(val))}
                            placeholder="Select credit account..."
                            options={accounts?.map(a => ({ value: a.id, label: a.name })) || []}
                            onOpen={() => setFocusedField('toAccount')}
                            onClose={() => setFocusedField(null)}
                        />
                    </div>
                }

                {!focusedField && detailFields}
            </>);
        
        default:
            return (
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-zinc-700 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-2xl font-bold text-zinc-100">Quick Add</h2>
                        <button onClick={handleClose} className="text-zinc-400 hover:text-white"><XIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="p-4 space-y-3 flex-grow overflow-y-auto">
                        {successMessage && <div className="bg-green-900/50 text-green-300 p-3 rounded-lg text-sm transition-opacity duration-300">{successMessage}</div>}
                        
                        {favoriteTransactions && favoriteTransactions.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-base font-semibold text-zinc-400 px-1">Favorites</h3>
                                {favoriteTransactions.map(fav => (
                                    <button key={fav.id} onClick={() => handleFavoriteClick(fav)} className="w-full text-left p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg flex items-center gap-4 transition-colors">
                                        <StarIcon className="w-6 h-6 text-amber-400 flex-shrink-0"/>
                                        <span className="font-semibold text-amber-200 text-lg">{fav.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3 pt-4">
                             <h3 className="text-base font-semibold text-zinc-400 px-1">Create New</h3>
                            <button onClick={() => setView('expense')} className="w-full text-left p-5 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex justify-between items-center transition-colors">
                                <div>
                                    <h3 className="font-semibold text-xl text-white">Record an Expense</h3>
                                    <p className="text-base text-zinc-400">Pay a bill, buy supplies, etc.</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-500"/>
                            </button>
                            <button onClick={() => setView('revenue')} className="w-full text-left p-5 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex justify-between items-center transition-colors">
                                <div>
                                    <h3 className="font-semibold text-xl text-white">Record Revenue</h3>
                                    <p className="text-base text-zinc-400">Receive a payment, make a sale, etc.</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-500"/>
                            </button>
                            <button onClick={() => setView('transfer')} className="w-full text-left p-5 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex justify-between items-center transition-colors">
                                <div>
                                    <h3 className="font-semibold text-xl text-white">Transfer Money</h3>
                                    <p className="text-base text-zinc-400">Move funds between two accounts.</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-500"/>
                            </button>
                             <button onClick={() => setView('borrow')} className="w-full text-left p-5 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex justify-between items-center transition-colors">
                                <div>
                                    <h3 className="font-semibold text-xl text-white">Borrow Money</h3>
                                    <p className="text-base text-zinc-400">Take out a loan, use a credit line, etc.</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-500"/>
                            </button>
                            <button onClick={() => setView('lend')} className="w-full text-left p-5 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex justify-between items-center transition-colors">
                                <div>
                                    <h3 className="font-semibold text-xl text-white">Lend Money</h3>
                                    <p className="text-base text-zinc-400">Provide a loan to another party.</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-500"/>
                            </button>
                            <button onClick={() => setView('custom')} className="w-full text-left p-5 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex justify-between items-center transition-colors">
                                <div>
                                    <h3 className="font-semibold text-xl text-white">Custom Entry</h3>
                                    <p className="text-base text-zinc-400">Record any two-sided transaction.</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-500"/>
                            </button>
                        </div>
                    </div>
                    <div className="p-4 border-t border-zinc-700 text-center flex-shrink-0">
                        <p className="text-xs text-zinc-500">For complex entries, use "Advanced Entry" on the Journal page.</p>
                    </div>
                </div>
            );
    }
  }

  return (
    <CSSTransition
      in={true} // Modal is always 'in' when rendered
      timeout={200}
      classNames="modal"
      unmountOnExit
    >
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center" aria-modal="true" role="dialog">
        <div className="w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] bg-zinc-800/80 backdrop-blur-xl text-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-700">
          {renderContent()}
        </div>
      </div>
    </CSSTransition>
  );
};

export default QuickAddModal;
