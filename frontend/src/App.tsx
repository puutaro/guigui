import wailsLogo from './assets/wails.png'
import './App.css'
import { useEffect, useState, useRef } from 'react';
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
import { useUndoRedo} from './form/hooks/useAndoRedo';
import { useKeyboardShortcut} from './form/hooks/useFormKeyShortcut';
import { WriteStdout, GetFormConfig, ExitWithNumber, WriteStderr } from '../wailsjs/go/main/App';
import { form } from '../wailsjs/go/models'

const VALID_MODES = ['form', 'list', 'alert'] as const;
type ViewType = typeof VALID_MODES[number] | 'loading';

function App() {
    useEscClose()
    const { viewType, setViewType,  configData, setConfigData } = useLoadConfig();
    
    // Altキーが押されているかどうかを管理するステート
    const [isAltPressed, setIsAltPressed] = useState(false);
    
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

    const isAltPressedRef = useRef(false);
    const isCtrlPressedRef = useRef(false);

    // Altキーの押下状態を監視するイベントリスナー
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key){
        case 'Alt':
          isAltPressedRef.current = true;
          setIsAltPressed(true);
          break;
        case 'Ctrl':
          isCtrlPressedRef.current = true;
          break;
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        switch (e.key){
        case 'Alt':
          isAltPressedRef.current = false;
          setIsAltPressed(false);
          break;
        case 'Ctrl':
          isCtrlPressedRef.current = false;
          break;
        }
      };

      // ウィンドウのフォーカスが外れたときなどのためにAltキーの状態をリセット
      const handleBlur = () => {
        isAltPressedRef.current = false;
        setIsAltPressed(false);
        isCtrlPressedRef.current = false;
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleBlur);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
      };
    }, []);
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const isExecutingRef = useRef(false);
    // ボタンのアクションを実行する共通関数
const handleButtonClick = async (btn: form.ButtonDef): Promise<void> => {
    if (isExecutingRef.current) {
      return;
    }
    isExecutingRef.current = true;
    if (btn.exitCode == 1){
      await ExitWithNumber(btn.exitCode);
    }
    
    let currentConfig = formConfigRef.current;
    let fields = currentConfig?.fields || [];
    let retries = 0;
    while (fields.length === 0 && retries < 5) {
      await sleep(10);
      console.log(`retry :${retries}`)
      currentConfig = formConfigRef.current;
      fields = currentConfig?.fields || [];
      retries++;
    }
    const separator = currentConfig?.separator || "!";
    // ★ ステートではなく、常に最新を保持している ref から値を取得する
    const currentValues = formValuesRef.current;
    const outputString = fields
      .map((field, index) => {
        try {
          const key = `${index}_${field.label}`;
          const rawValue = currentValues[key] ?? field.defaultValue ?? "";
          console.log(`condole ${key}, ${rawValue}`);
          switch (field.type) {
            case 'NUM':
              return rawValue.toString().split('!')[0];
          } 
          return rawValue;
        } catch (err: any) {
          // どこで、何というエラーで落ちたかを確実にファイルや標準出力に吐かせる
          console.log(`Exception at index ${index}: ${err?.message || err}`);
          return "";
        }
      })
      .join(separator);
      
    await WriteStdout(outputString ?? "");
    await ExitWithNumber(btn.exitCode);
  };

    const formConfigRef = useRef(formConfig);
    const formValuesRef = useRef(formValues);

    useEffect(() => {
      formConfigRef.current = formConfig;
      formValuesRef.current = formValues;
    }, [formConfig, formValues]);
    // Alt + 頭文字キーによるショートカット処理
    useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      const currentConfig = formConfigRef.current;
      if (!currentConfig?.buttons) return;
      // 除外すべきキーの判定を厳格化
      switch (true){
      case ((e.altKey || isAltPressedRef.current) && !['Alt', 'Shift', 'Control', 'Enter', 'Tab', ' '].includes(e.key)):{
        const pressedKey = e.key.toLowerCase();
        
        // 厳密にボタンの頭文字と一致するものがあるかチェック
        const targetButton = currentConfig.buttons.find(btn => {
          if (!btn.label || btn.label.length === 0) return false;
          return btn.label.charAt(0).toLowerCase() === pressedKey;
        });

        // 完全に一致するボタンが存在する場合のみ、イベントを止めて実行する
        if (targetButton) {
          e.preventDefault();
          const initHanelButtonClidk = async () =>{
            await handleButtonClick(targetButton);
          }
          initHanelButtonClidk()
        }
        break
      }
      case (e.ctrlKey && e.key == 'Enter'):{
        let pressedKey = 'o';
        const targetButton = currentConfig.buttons.find(btn => {
        if (!btn.label || btn.label.length === 0) return false;
          return btn.label.charAt(0).toLowerCase() === pressedKey;
        });
        if (targetButton) {
          e.preventDefault();
          const initHanelButtonClidk = async () =>{
            await handleButtonClick(targetButton);
          }
          initHanelButtonClidk()
        }
      }
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

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

                    // alert("res の内容: " + JSON.stringify(res, null, 2));
                })
                .catch((err) => {
                    console.error("Failed to load form config:", err);
                });
        }
    }, [viewType]);

    if (viewType === VIEW_MODES.LOADING) {
      return <div className="p-8 text-center">Loading...</div>;
    }
    const borderValue = formConfig?.borders ?? 0;
    const fontSizeInt = formConfig?.fontSize ? formConfig.fontSize : 10;
    const fontSizeValue = `${fontSizeInt}px`;
    const labelFontSizeValue = `${(fontSizeInt * 3) / 4}px`;

  return (
    <div className="min-h-screen bg-white p-8 font-mono" 
      style={{ fontSize: fontSizeValue }}
    >
      
      <div >
      {/* <div className="max-w-md mx-auto"> */}
        {viewType === VIEW_MODES.FORM && (
          <div id="form-view" className="flex flex-col h-[calc(100vh-4rem)]">
            <h1 className="text-2xl font-bold text-blue-900 mb-4 flex-shrink-0">
              {formConfig?.text ?? ""}
            </h1>
          {!formConfig ? (
              <div className="text-gray-500">Loading form...</div>
            ) : (
            <div 
              className="flex flex-col h-full overflow-hidden"
              style={{ padding: `${borderValue}px` }}
            >
              {/* --- 1. スクロール可能なフィールド領域 --- */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {formConfig.fields.map((field, index) => {
                  const key = `${index}_${field.label}`;
                  return (
                    <div 
                      key={index} 
                      className="flex flex-col"
                      style={{ paddingBottom: `${borderValue}px` }}
                    >
                      {/* (フィールドの描画ロジックはそのまま) */}
                      <label 
                        className="font-bold mb-1"
                        style={{ 
                          fontSize: labelFontSizeValue,
                          padding: `${borderValue}px` 
                        }}
                      >
                        {field.label}
                      </label>
                      
                      {field.type === 'TXT' && (
                        <input 
                          type="text" 
                          value={formValues[key] ?? field.defaultValue ?? ""} 
                          onChange={(e) => setFieldValue(key, e.target.value)}
                          className="border rounded" 
                          style={{ padding: `${borderValue}px` }}
                        />
                      )}
                      
                      {field.type === 'CB' && (
                        <select 
                          value={formValues[key] ?? field.defaultValue ?? ""}
                          onChange={(e) => setFieldValue(key, e.target.value)}
                          className="border rounded"
                          style={{ padding: `${borderValue}px` }}
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
                            console.log("FBTN clicked, command:", field.defaultValue);
                          }}
                          className="border rounded bg-gray-100 hover:bg-gray-200 text-left active:bg-gray-300"
                          style={{ padding: `${borderValue}px` }}
                        >
                          FBTN
                        </button>
                      )}
                      {field.type === 'LBL' && (
                        <span 
                          className="text-gray-600 block"
                          style={{ padding: `${borderValue}px` }}
                        >
                          {field.defaultValue}
                        </span>
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
                                className="border rounded-l rounded-r-none flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right"
                                style={{ padding: `${borderValue}px` }}
                              />
                              <button
                                type="button"
                                onClick={() => handleStep(-1)}
                                className="border-t border-b border-r bg-gray-100 hover:bg-gray-200 text-sm active:bg-gray-300"
                                style={{ padding: `${borderValue}px` }}
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStep(1)}
                                className="border-t border-b border-r rounded-r bg-gray-100 hover:bg-gray-200 text-sm active:bg-gray-300"
                                style={{ padding: `${borderValue}px` }}
                              >
                                +
                              </button>
                            </div>
                          );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* --- 2. ウィンドウ最下部に固定されるボタン領域 --- */}
              <div className="flex justify-end space-x-2 pt-4 border-t mt-2 flex-shrink-0 bg-white">
                {formConfig.buttons?.map((btn, idx) => {
                  const label = btn.label || "";
                  const firstChar = label.charAt(0);
                  const restChars = label.slice(1);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleButtonClick(btn)}
                      className="border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-sm shadow-sm"
                      style={{ 
                          padding: `${borderValue}px`, 
                          fontSize: fontSizeValue,
                      }}
                    >
                      {isAltPressed && firstChar ? (
                        <>
                          <span className="underline">{firstChar}</span>
                          {restChars}
                        </>
                      ) : (
                        label
                      )}
                    </button>
                  );
                })}
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