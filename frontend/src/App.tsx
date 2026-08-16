import wailsLogo from './assets/wails.png'
import './App.css'
import { useEffect, useState } from 'react';
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
import { useUndoRedo} from './form/hooks/useAndoRedo';
import { useKeyboardShortcut} from './form/hooks/useFormKeyShortcut';
import { WriteStdout, GetFormConfig, ExitWithNumber } from '../wailsjs/go/main/App';
import { form } from '../wailsjs/go/models'

const VALID_MODES = ['form', 'list', 'alert'] as const;
type ViewType = typeof VALID_MODES[number] | 'loading';

function App() {
    useEscClose()
    const { viewType, setViewType,  configData, setConfigData } = useLoadConfig();
    
    // 1. undo/redo フックでフォーム全体の値を管理（初期値は空のオブジェクト）
    const { 
      state: formValues, 
      set: setFormValues, 
      setFieldValue, 
      undo, 
      redo, 
      canUndo, 
      canRedo 
    } = useUndoRedo<Record<string, string>>({});

    // フォーム設定を保持するステート
    const [formConfig, setFormConfig] = useState<form.FormConfigResponse | null>(null);

    useKeyboardShortcut({
      onUndo: () => {
        if (canUndo) undo();
      },
      onRedo: () => {
        if (canRedo) redo();
      },
    });

    // コンポーネントマウント時に Go から設定を取得
    useEffect(() => {
        if (viewType === VIEW_MODES.FORM) {
            GetFormConfig()
                .then((res) => {
                    setFormConfig(res);
                    
                    // 取得したデフォルト値を初期値としてフォームの値ステートにセットする
                    const initialValues: Record<string, string> = {};
                    res.fields.forEach((field, index) => {
                        const key =  `${index}_${field.label}`;
                        initialValues[key] = field.defaultValue || "";
                    });
                    setFormValues(initialValues);

                    alert("res の内容: " + JSON.stringify(res, null, 2));
                })
                .catch((err) => {
                    console.error("Failed to load form config:", err);
                });
        }
    }, [viewType]);

    if (viewType === VIEW_MODES.LOADING) {
      return <div className="p-8 text-center">Loading...</div>;
    }

  return (
    <div className="min-h-screen bg-white p-8 font-mono">
      <div className="max-w-md mx-auto">
        {viewType === VIEW_MODES.FORM && (
          <div id="form-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">Form Dialog</h1>
          {!formConfig ? (
              <div className="text-gray-500">Loading form config...</div>
            ) : (
              <div className="space-y-4">
                {formConfig.fields.map((field, index) => {
                  const key = `${index}_${field.label}`;
                  return (
                    <div key={index} className="flex flex-col">
                      <label className="font-bold text-sm mb-1">{field.label}</label>
                      
                      {field.type === 'TXT' && (
                        <input 
                          type="text" 
                          value={formValues[key] ?? field.defaultValue ?? ""} 
                          onChange={(e) => setFieldValue(key, e.target.value)} // <-- 個別フィールドの変更とUndo/Redoを紐付け
                          className="border p-2 rounded" 
                        />
                      )}
                      
                      {field.type === 'CB' && (
                        <select 
                          value={formValues[key] ?? field.defaultValue ?? ""}
                          onChange={(e) => setFieldValue(key, e.target.value)} // <-- セレクトボックスも同様
                          className="border p-2 rounded"
                        >
                          {field.items?.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      )}
                      {field.type === 'FBTN' && (
                        <button
                          type="button"
                          onClick={() => {
                            // yadの btn:FBTN="echo aa" などを想定したアクションのプレースホルダー
                            console.log("FBTN clicked, command:", field.defaultValue);
                          }}
                          className="border p-2 rounded bg-gray-100 hover:bg-gray-200 text-left active:bg-gray-300"
                        >
                          FBTN
                        </button>
                      )}
                      {field.type === 'LBL' && (
                        <span className="text-gray-600">{field.defaultValue}</span>
                      )}
                    {field.type === 'NUM' && (() => {
                        const parts = (field.defaultValue || "").split('!');
                        const defaultVal = parts[0] ? parseFloat(parts[0]) : 0;
                        const rangePart = parts[1] || "";
                        const stepVal = parts[2] ? parseFloat(parts[2]) : 1;
                        const decimals = parts[2] && parts[2].includes('.') ? parts[2].split('.')[1].length : 0;

                        const [minStr, maxStr] = rangePart.split('..');
                        const minVal = minStr ? parseFloat(minStr) : undefined;
                        const maxVal = maxStr ? parseFloat(maxStr) : undefined;

                        const currentValue = formValues[key] !== undefined ? formValues[key].split('!')[0] : defaultVal;

                        const handleStep = (direction: number) => {
                          const currentNum = parseFloat(currentValue.toString()) || 0;
                          let nextNum = currentNum + direction * stepVal;
                          
                          if (minVal !== undefined && nextNum < minVal) nextNum = minVal;
                          if (maxVal !== undefined && nextNum > maxVal) nextNum = maxVal;

                          setFieldValue(key, nextNum.toFixed(decimals));
                        };

                        return (
                          <div className="flex items-center">
                            <input 
                              type="number"
                              step={stepVal}
                              min={minVal}
                              max={maxVal}
                              value={currentValue}
                              onChange={(e) => setFieldValue(key, e.target.value)}
                              className="border p-2 rounded-l rounded-r-none flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right"
                            />
                            <button
                              type="button"
                              onClick={() => handleStep(-1)}
                              className="border-t border-b border-r bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm active:bg-gray-300"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStep(1)}
                              className="border-t border-b border-r rounded-r bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm active:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
                <div className="flex justify-end space-x-2 pt-4 border-t mt-auto">
                  {formConfig.buttons?.map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // 各フィールドの値を formConfig.itemSeparator で結合する文字列を作成
                        const separator = formConfig.separator || "!";
                        const outputString = formConfig.fields
                          .map((field, index) => {
                            const key = `${index}_${field.label}`;
                            const rawValue = formValues[key] ?? field.defaultValue ?? "";
                            // NUMフィールドの場合は '!' で分割して最初の値（現在の数値）だけを使用する
                            switch (field.type) {
                              case 'NUM':
                                return rawValue.toString().split('!')[0];
                            } 
                            return rawValue;
                          })
                          .join(separator);
                        WriteStdout(outputString);
                        ExitWithNumber(btn.exitCode);
                      }}
                      className="border px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-sm shadow-sm"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {viewType === VIEW_MODES.LIST && (
          <div id="list-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">List Dialog</h1>
          </div>
        )}

        {viewType === VIEW_MODES.ALERT && (
          <div id="alert-view">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">Alert Dialog</h1>
          </div>
        )}
      </div>
    </div>
  );
}

export default App