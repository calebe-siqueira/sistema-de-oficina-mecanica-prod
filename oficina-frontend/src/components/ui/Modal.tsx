import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { CloseIcon } from './Icons';

export interface ModalProps {
  title: string | ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  subtitle?: string | ReactNode;
  maxWidth?: string;
  className?: string;
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  subtitle,
  children,
  isOpen,
  onClose,
  maxWidth = 'max-w-lg',
  className = '',
  closeOnBackdropClick = false,
}) => {
  // Rastreia se a ação de fechamento foi disparada via teclado (Escape)
  const isEscapePressedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isEscapePressedRef.current = true;
        // Reseta após a propagação síncrona do evento
        window.setTimeout(() => {
          isEscapePressedRef.current = false;
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const handleClose = () => {
    // Permite fechar via Escape ou se closeOnBackdropClick estiver explicitamente habilitado
    if (closeOnBackdropClick || isEscapePressedRef.current) {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      {/* Fundo escurecido (Backdrop) com transição fluida */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 data-[closed]:opacity-0"
      />

      {/* Container de posicionamento centralizado */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={`bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full ${maxWidth} overflow-hidden text-slate-800 transition duration-200 data-[closed]:opacity-0 data-[closed]:scale-95 ${className}`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
            <div>
              {typeof title === 'string' ? (
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {title}
                </DialogTitle>
              ) : (
                <DialogTitle as="div" className="text-base font-semibold text-slate-900">
                  {title}
                </DialogTitle>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal"
              title="Fechar"
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors leading-none"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
