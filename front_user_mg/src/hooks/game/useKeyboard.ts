import { useEffect } from 'react';
import { LocalInputHandler } from '../../game/keyboard/bindings';

export function useKeyboard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handler = LocalInputHandler.getInstance();
    handler.listen();

    return () => handler.reset();
  }, [enabled]);
}