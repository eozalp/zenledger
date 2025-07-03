import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import QuickAddModal from './QuickAddModal';
import { CSSTransition } from 'react-transition-group';
import { useDatabase } from '../hooks/useDatabase';

interface LayoutProps {
  children: React.ReactNode;
  db: ReturnType<typeof useDatabase>;
}

const NavItem: React.FC<{ to: string; children: React.ReactNode; label: string }> = ({ to, children, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full py-2 text-sm transition-colors duration-200 ${
          isActive ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
        }`
      }
    >
      {children}
      <span className="mt-1">{label}</span>
    </NavLink>
);


const Layout: React.FC<LayoutProps> = ({ children, db }) => {
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;

      if (
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.isContentEditable) &&
        !target.closest('[role="dialog"]')
      ) {
        // A short delay helps ensure the keyboard is visible before scrolling
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-50">
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </main>

      <CSSTransition
        in={isQuickAddOpen}
        timeout={200}
        classNames="modal"
        unmountOnExit
      >
        <QuickAddModal db={db} isOpen={isQuickAddOpen} onClose={() => setQuickAddOpen(false)} />
      </CSSTransition>
      
      <nav className="fixed bottom-0 left-0 right-0 z-10 grid h-20 grid-cols-5 items-center justify-around border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <NavItem to="/" label="Dashboard">
            <TrendingUpIcon className="w-7 h-7" />
        </NavItem>
        <NavItem to="/transactions" label="Entries">
            <BookOpenIcon className="w-7 h-7" />
        </NavItem>

        <div className="flex justify-center items-center">
            <button 
                onClick={() => setQuickAddOpen(true)}
                className="flex items-center justify-center w-20 h-20 -mt-10 bg-indigo-600 rounded-full text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-transform transform hover:scale-110"
                aria-label="Add new transaction"
            >
                <PlusCircleIcon className="w-10 h-10"/>
            </button>
        </div>

        <NavItem to="/accounts" label="Accounts">
            <UsersIcon className="w-7 h-7" />
        </NavItem>
        <NavItem to="/settings" label="Settings">
            <SettingsIcon className="w-7 h-7" />
        </NavItem>
      </nav>
    </div>
  );
};

export default Layout;