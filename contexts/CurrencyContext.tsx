
import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { Currency, SettingKey } from '../types';

interface CurrencyContextType {
    currencies: Currency[];
    defaultCurrency: Currency | undefined;
    displayCurrency: Currency | undefined;
    formatCurrency: (valueInDefault: number, options?: { currencyId?: number, symbol?: boolean }) => string;
    convert: (amount: number, fromCurrencyId: number, toCurrencyId: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currencies, settings } = useDatabase();

    const { defaultCurrency, displayCurrency } = useMemo(() => {
        // Guard clause for when data is not loaded yet or DB is empty.
        if (!currencies || !settings || currencies.length === 0) {
            return { defaultCurrency: undefined, displayCurrency: undefined };
        }

        const defaultId = settings.find(s => s.key === SettingKey.DefaultCurrencyId)?.value;
        let defaultCurr = currencies.find(c => c.id === defaultId);
        
        // If no default currency is set in settings OR the set currency doesn't exist anymore,
        // fall back to the first available currency. This makes the system self-healing.
        if (!defaultCurr) {
            defaultCurr = currencies[0];
        }

        const displayId = settings.find(s => s.key === SettingKey.DisplayCurrencyId)?.value;
        let displayCurr = currencies.find(c => c.id === displayId);

        // If no display currency is set, or it doesn't exist, fall back to the default currency.
        if (!displayCurr) {
            displayCurr = defaultCurr;
        }
        
        return { defaultCurrency: defaultCurr, displayCurrency: displayCurr };
    }, [currencies, settings]);

    const convert = useCallback((amount: number, fromCurrencyId: number, toCurrencyId: number): number => {
        if (!currencies || !defaultCurrency || fromCurrencyId === toCurrencyId) return amount;
        
        const from = currencies.find(c => c.id === fromCurrencyId);
        const to = currencies.find(c => c.id === toCurrencyId);

        if (!from || !to) {
            console.error("Could not find currency for conversion");
            return amount;
        }

        // First, convert 'from' amount to default currency
        const amountInDefault = from.id === defaultCurrency.id ? amount : amount * from.exchangeRate;

        // Then, convert from default currency to 'to' currency
        if (to.id === defaultCurrency.id) {
            return amountInDefault;
        } else {
            // My types.ts says: Rate to convert FROM this currency TO the default currency
            // So if 1 EUR = 1.1 USD (default), rate is 1.1.
            // 10 EUR * 1.1 = 11 USD. Correct.
            // How to get EUR from USD? 11 USD / 1.1 = 10 EUR.
            // So to convert FROM default TO foreign, we divide by the foreign rate.
             return amountInDefault / to.exchangeRate;
        }
    }, [currencies, defaultCurrency]);
    
    // The main formatting function. Takes a value that is ALWAYS in the default currency.
    const formatCurrency = useCallback((valueInDefault: number, options?: { currencyId?: number, symbol?: boolean }): string => {
        const { currencyId, symbol = true } = options || {};

        // This is the critical fix. Guard against undefined currencies during initial load.
        if (!currencies || !displayCurrency || !defaultCurrency) {
            // Provide a sensible, non-crashing fallback.
            return (valueInDefault || 0).toFixed(2);
        }
        
        const targetCurrency = currencyId ? currencies.find(c => c.id === currencyId) : displayCurrency;
        
        if (!targetCurrency) {
            return (valueInDefault || 0).toFixed(2);
        }
        
        // At this point, defaultCurrency is guaranteed to be defined. No need for `!`.
        const convertedValue = convert(valueInDefault, defaultCurrency.id, targetCurrency.id);

        try {
          return new Intl.NumberFormat(undefined, {
            style: symbol ? 'currency' : 'decimal',
            currency: targetCurrency.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(convertedValue);
        } catch (e) {
           // Fallback for unsupported currency codes in Intl
           return `${symbol ? targetCurrency.symbol : ''}${convertedValue.toFixed(2)}`;
        }

    }, [currencies, displayCurrency, defaultCurrency, convert]);

    const value = {
        currencies: currencies || [],
        defaultCurrency,
        displayCurrency,
        formatCurrency,
        convert,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
