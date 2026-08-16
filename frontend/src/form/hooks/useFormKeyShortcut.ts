import { useEffect } from 'react';

interface ShortcutOptions {
  onUndo: () => void;
  onRedo: () => void;
}

export function useKeyboardShortcut({ onUndo, onRedo }: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (!isCtrlOrCmd) return;

      // Ctrl + Z (MacはCmd + Z)
      if (event.key.toLowerCase() === 'z') {
        if (event.shiftKey) {
          // Ctrl + Shift + Z も Redo として扱う場合
          event.preventDefault();
          onRedo();
        } else {
          event.preventDefault();
          onUndo();
        }
      }

      // Ctrl + Y (Windowsの一般的なRedo)
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onUndo, onRedo]);
}