import { useEffect, useState } from 'react';
import { ExitWith252, GetActiveMode } from '../wailsjs/go/main/App';

export const VIEW_MODES = {
  LOADING: 'loading',
  FORM: 'form',
  LIST: 'list',
} as const;

export type ViewType = typeof VIEW_MODES[keyof typeof VIEW_MODES];

export function useEscClose() {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                ExitWith252()
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
}

export function useLoadConfig() {
  const [viewType, setViewType] = useState<ViewType>(VIEW_MODES.LOADING);

  useEffect(() => {
    async function loadConfig() {
      try {
        const mode = await GetActiveMode();
        setViewType((mode || VIEW_MODES.FORM) as ViewType); 
      } catch (err) {
        console.error("Failed to load config", err);
      }
    }
    loadConfig();
  }, []);
  return { viewType, setViewType };
}