import wailsLogo from './assets/wails.png'
import './App.css'
import { useEffect, useState, useRef } from 'react';
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
import { useUndoRedo} from './form/hooks/useAndoRedo';
import { useKeyboardShortcut} from './form/hooks/useFormKeyShortcut';
import { WriteStdout, GetFormConfig, GetListConfig, ExitWithNumber, WriteStderr } from '../wailsjs/go/main/App';
import { form, list } from '../wailsjs/go/models'
import { FormComponent } from './form/FormComponent';

const VALID_MODES = ['form', 'list', 'alert'] as const;
type ViewType = typeof VALID_MODES[number] | 'loading';

function App() {
    useEscClose()
    const { viewType, setViewType } = useLoadConfig();
    
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
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [listItems, setListItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      if (viewType !== VIEW_MODES.LIST) return
      setSelectedIndex(0);
    }, [searchQuery, listItems]);

    const filteredListItems = viewType === VIEW_MODES.LIST ? listItems.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    ) : []
    // selectedIndex やリストの絞り込み結果が変わったときに、DOMが存在していればフォーカスを当てる
    useEffect(() => {
      if (viewType !== VIEW_MODES.LIST) return
      // 少しだけタイミングをずらすか、DOMの描画完了を待ってフォーカスする
      requestAnimationFrame(() => {
        const targetListElement = listItemRefs.current[selectedIndex];
        if (!targetListElement) return
        targetListElement.focus();
      });
    }, [selectedIndex, viewType, filteredListItems]);

    // リスト用のDOM要素（li）を格納するための配列参照
    const listItemRefs = useRef<(HTMLLIElement | null)[]>([]);

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
      return
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
    const currentValues = formValuesRef.current;
    const outputString = fields
      .map((field, index) => {
        try {
          const label = field.label;
          const key = `${index}_${label}`;
          const rawValue = currentValues[key] ?? field.defaultValue ?? "";
          console.log(`condole ${key}, ${rawValue}`);
          return rawValue;
        } catch (err: any) {
          // どこで、何というエラーで落ちたかを確実にファイルや標準出力に吐かせる
          console.log(`Exception at index ${index}: ${err?.message || err}`);
          return "";
        }
      })
      .join(separator);
    // await WriteStdout(outputList.join("===")) 
    await WriteStdout(outputString);
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

        // 1. Alt / Option ショートカットの判定
        // e.keyの代わりに e.code を使い、'KeyA' などの文字列から末尾の文字(a)を取得する
        const isAltActive = e.altKey || isAltPressedRef.current;
        const isModifierKey = ['Alt', 'Shift', 'Control', 'Enter', 'Tab', ' '].includes(e.key);

        if (isAltActive && !isModifierKey && e.code.startsWith('Key')) {
          // e.code は "KeyA" や "KeyB" になるので、最後の1文字を小文字で取得
          const pressedKey = e.code.replace('Key', '').toLowerCase();
          
          const targetButton = currentConfig.buttons.find(btn => {
            if (!btn.label || btn.label.length === 0) return false;
            return btn.label.charAt(0).toLowerCase() === pressedKey;
          });

          if (targetButton) {
            e.preventDefault();
            handleButtonClick(targetButton);
            return;
          }
        }

        // 2. Ctrl + Enter ショートカットの判定
        // e.ctrlKey だけでなく Mac対応のために isCtrlPressedRef も考慮
        const isCtrlActive = e.ctrlKey || isCtrlPressedRef.current;
        if (isCtrlActive && e.key === 'Enter') {
          const pressedKey = 'o';
          const targetButton = currentConfig.buttons.find(btn => {
            const btnLabel = btn.label
            if (!btnLabel || btnLabel.length === 0) return false;
            return btnLabel.charAt(0).toLowerCase() === pressedKey;
          });
          if (targetButton) {
            e.preventDefault();
            handleButtonClick(targetButton);
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
                })
                .catch((err) => {
                    console.error("Failed to load form config:", err);
                });
        } else if (viewType === VIEW_MODES.LIST) {
            // TODO: リスト用のGo側APIがある場合はここで呼び出す
            // 例: GetListItems().then(res => setListItems(res)).catch(...)
            GetListConfig()
              .then((res) =>{ 
                setListItems(res.list)
            }).catch((err) =>{
                    console.error("Failed to load form config:", err);
            })

        }
    }, [viewType]);

    const borderValue = formConfig?.borders ?? 0;
    const fontSizeInt = formConfig?.fontSize ? formConfig.fontSize : 10;
    const fontSizePx = `${fontSizeInt}px`;

    if (viewType === VIEW_MODES.LOADING) {
      return <div className="p-8 text-center">Loading...</div>;
    }
  return (
    <div className="min-h-screen bg-white p-8 font-mono" 
      style={{ fontSize: fontSizePx }}
    >
      <div >
      {/* <div className="max-w-md mx-auto"> */}
        {viewType === VIEW_MODES.FORM && (
          <FormComponent
            formConfig={formConfig}
            formValues={formValues}
            setFieldValue={setFieldValue}
            handleButtonClick={handleButtonClick}
            isAltPressed={isAltPressed}
            borderValue={borderValue}
          />
        ) }

       {viewType === VIEW_MODES.LIST && (
          <div 
            id="list-view" 
            className="flex flex-col gap-4 max-w-lg mx-auto"
            onKeyDown={(e) => {
              if (filteredListItems.length === 0) return;
              switch (true) {
                case (e.key === 'ArrowDown'): {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < filteredListItems.length - 1 ? prev + 1 : prev));
                } 
                break;
                case (e.key === 'ArrowUp'): {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                } 
                break;
                case (e.key === 'Enter'): {
                  e.preventDefault();
                  const selectedItem = filteredListItems[selectedIndex];
                  if (!selectedItem) return
                  (async () => {
                    try {
                      await WriteStdout(selectedItem);
                      await ExitWithNumber(0);
                    } catch (err) {
                      console.error("Failed to output selected item:", err);
                    }
                  })();
                }
                break;
                case (
                  (e.key.length === 1 
                  && !e.ctrlKey 
                  && !e.metaKey 
                  && !e.altKey ) ||
                  e.key === 'Backspace' || 
                  e.key === 'Delete'
                ): {
                  // ★ リストにフォーカスがある状態で文字キーが押されたら、
                  // 瞬時に検索窓にフォーカスを戻し、入力を邪魔しないようにする
                  e.preventDefault();
                  searchInputRef.current?.focus();
                  switch (true) {
                    case e.key === 'Backspace': {
                      // Backspaceの場合は検索クエリの末尾を1文字削る
                      setSearchQuery(prev => prev.slice(0, -1));
                    }
                    break;
                    case (e.key === 'Delete'): {
                      // Deleteの場合は必要に応じて全クリアにするか、何もしないなどをお好みで設定できます
                      // 今回はBackspaceと同様に末尾を削る動作にしておくと自然です
                      setSearchQuery(prev => prev.slice(0, -1));
                    }
                    break;
                    default: {
                      // 通常の文字入力
                      setSearchQuery(prev => prev + e.key);
                    }
                    break;
                  }
                }
                break;
              }
            }}
          >
            <h1 className="text-2xl font-bold text-blue-900 mb-1">List Dialog</h1>
            <input
              ref={searchInputRef} // ★ Refを紐付け
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (
                  e.key === 'ArrowDown' || 
                  e.key === 'ArrowUp'
                ) {
                  e.preventDefault();
                  listItemRefs.current[0]?.focus();
                }
              }}
            />

            {/* 絞り込み結果を表示するスクロールエリア */}
            <div className="border border-gray-300 rounded p-2 max-h-[60vh] overflow-y-auto">
              {filteredListItems.length === 0 ? (
                <p className="text-gray-500 p-2">No matching items.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {filteredListItems.map((item, index) => (
                    <li 
                      key={index}
                      tabIndex={0}
                      ref={(el) => (listItemRefs.current[index] = el)}
                      className="p-2 hover:bg-blue-50 focus:bg-blue-100 focus:outline-none rounded cursor-pointer border border-transparent focus:border-blue-400"
                      onClick={() => {
                        setSelectedIndex(index);
                        listItemRefs.current[index]?.focus();
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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