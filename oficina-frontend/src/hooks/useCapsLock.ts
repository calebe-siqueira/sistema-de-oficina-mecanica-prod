import { useState, useCallback } from 'react';

/**
 * useCapsLock
 *
 * Hook para detectar de forma reativa e não invasiva se a tecla Caps Lock
 * está ativa durante a digitação em campos de formulário (ex: senha).
 */
export function useCapsLock() {
  const [isCapsLockOn, setIsCapsLockOn] = useState<boolean>(false);

  const checkCapsLock = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.getModifierState) {
      const capsOn = event.getModifierState('CapsLock');
      setIsCapsLockOn(capsOn);
    }
  }, []);

  const handleFocus = useCallback((event: React.FocusEvent<HTMLElement>) => {
    // Alguns navegadores permitem checar no evento de foco com teclado
    if ('getModifierState' in event && typeof (event as any).getModifierState === 'function') {
      setIsCapsLockOn((event as any).getModifierState('CapsLock'));
    }
  }, []);

  const resetCapsLock = useCallback(() => {
    setIsCapsLockOn(false);
  }, []);

  return {
    isCapsLockOn,
    checkCapsLock,
    handleFocus,
    resetCapsLock,
  };
}
