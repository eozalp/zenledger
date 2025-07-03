import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | undefined;
    onChange: (value: string | number) => void;
    placeholder?: string;
    onOpen?: () => void;
    onClose?: () => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Select an option...", onOpen, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(option => option.value === (value ? Number(value) : undefined));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    setIsOpen(false);
                    setSearchTerm('');
                    onClose?.();
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, isOpen, onClose]);

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
        onClose?.();
    };
    
    const toggleOpen = () => {
        const nextIsOpen = !isOpen;
        setIsOpen(nextIsOpen);
        if (nextIsOpen) {
            onOpen?.();
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setSearchTerm('');
            onClose?.();
        }
    }

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                onClick={toggleOpen}
                className="w-full bg-zinc-700 p-4 rounded-lg border-2 border-transparent focus-within:border-indigo-500 flex justify-between items-center cursor-pointer"
            >
                <span className={`text-lg truncate ${selectedOption ? 'text-white' : 'text-zinc-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDownIcon className={`w-6 h-6 text-zinc-400 transition-transform shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 text-white p-2 rounded-md border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <ul className="py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelect(option)}
                                    className="px-4 py-3 text-lg text-zinc-200 hover:bg-indigo-600 cursor-pointer"
                                >
                                    {option.label}
                                </li>
                            ))
                        ) : (
                             <li className="px-4 py-3 text-lg text-zinc-500">No results found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;