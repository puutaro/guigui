import { useState, useEffect } from 'react';
import { ExitWith252 } from '../wailsjs/go/main/App';
import { GetActiveMode } from '../wailsjs/go/main/App';

export function useEscClose() {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                ExitWith252()
                window.go.main.App.ExitWith252();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
}

// 必要に応じて型定義（既存のものがあればインポートしてください）
export type ViewType = 'loading' | 'form' | 'list' ;

// 外部から渡されると想定される GetActiveMode（適切にインポートしてください）
// import { GetActiveMode } from './api'; 

export function useLoadConfig() {
  const [viewType, setViewType] = useState<ViewType>('loading');
  const [configData, setConfigData] = useState<any>(null); // 必要ならデータ保持

  useEffect(() => {
    async function loadConfig() {
      try {
        const mode = await GetActiveMode();
        setViewType((mode || 'form') as ViewType); 
      } catch (err) {
        console.error("Failed to load config", err);
      }
    }

    loadConfig();
  }, []);
}