import wailsLogo from './assets/wails.png'
import './App.css'
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
// import { GetAppModes } from '../wailsjs/go/main/App';

const VALID_MODES = ['form', 'list', 'alert'] as const;
type ViewType = typeof VALID_MODES[number] | 'loading';

function App() {
    useEscClose()
    const { viewType, setViewType,  configData, setConfigData } = useLoadConfig();
  if (viewType === VIEW_MODES.LOADING) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-white p-8 font-mono">
      <div className="max-w-md mx-auto">
        {viewType === VIEW_MODES.FORM && (
          <div id="form-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">Form Dialog</h1>
            {/* フォーム用のコンポーネントやフィールド描画 */}
          </div>
        )}

        {viewType === VIEW_MODES.LIST && (
          <div id="list-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">List Dialog</h1>
            {/* リスト・カラム用のコンポーネント描画 */}
          </div>
        )}

        {viewType === VIEW_MODES.ALERT && (
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
