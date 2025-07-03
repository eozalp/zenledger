import React from 'react';
import { CSSTransition } from 'react-transition-group';
import { XIcon } from './icons/XIcon';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, children, title }) => {
  return (
    <CSSTransition
      in={isOpen}
      timeout={200}
      classNames="modal"
      unmountOnExit
    >
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" aria-modal="true" role="dialog">
        <div className="w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-zinc-800/80 backdrop-blur-xl text-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-700">
          <div className="p-4 border-b border-zinc-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-zinc-100">{title || 'Information'}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white"><XIcon className="w-6 h-6"/></button>
          </div>
          <div className="p-4 overflow-y-auto flex-grow">
            {children}
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default InfoModal;
