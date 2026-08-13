import wailsLogo from './assets/wails.png'
import { useState, useEffect } from 'react';
import './App.css'
import { GetActiveMode } from '../wailsjs/go/main/App';

const VALID_MODES = ['form', 'list', 'alert'] as const;
type ViewType = typeof VALID_MODES[number] | 'loading';

function App() {
    const [viewType, setViewType] = useState<'loading' | 'form' | 'list' | 'alert'>('loading');
    const [configData, setConfigData] = useState<any>(null);
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
  if (viewType === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-white p-8 font-mono">
      <div className="max-w-md mx-auto">
        {viewType === 'form' && (
          <div id="form-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">Form Dialog</h1>
            {/* フォーム用のコンポーネントやフィールド描画 */}
          </div>
        )}

        {viewType === 'list' && (
          <div id="list-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">List Dialog</h1>
            {/* リスト・カラム用のコンポーネント描画 */}
          </div>
        )}

        {viewType === 'alert' && (
          <div id="alert-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">Alert Dialog</h1>
            {/* アラートメッセージ（Text）の描画 */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App
