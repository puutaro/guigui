import { useEffect, useState } from 'react';
import { GetActiveMode } from '../wailsjs/go/main/App';
import {Exit252ByMinimise} from "./exit/exit";
import { KeepConfig } from "./type/keepInfo";

export const VIEW_MODES = {
  LOADING: 'loading',
  FORM: 'form',
  LIST: 'list',
} as const;

export type ViewType = typeof VIEW_MODES[keyof typeof VIEW_MODES];

export function useEscClose(keepConfigRef: React.MutableRefObject<KeepConfig>) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                Exit252ByMinimise(
                  keepConfigRef.current, 
                  'esc'
                )
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