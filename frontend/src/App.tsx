import wailsLogo from './assets/wails.png'
import './App.css'
import { useEffect, useState, useRef } from 'react';
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
import { filterListItems } from './list/filer';
import { useUndoRedo} from './form/hooks/useAndoRedo';
import { useKeyboardShortcut} from './form/hooks/useFormKeyShortcut';
import { 
  WriteStdout, 
  GetFormConfig, 
  GetListConfig, 
  ExitWithNumber, 
  RunReloadCmdForList, 
  RunCmdForList,
  RunCmdByQuitForList,
  WriteStderr,
 } from '../wailsjs/go/main/App';
import { form, list } from '../wailsjs/go/models'
import { FormComponent } from './form/FormComponent';

const VALID_MODES = ['form', 'list', 'alert'] as const;
type ViewType = typeof VALID_MODES[number] | 'loading';

function App() {
    useEscClose()
    const { viewType, setViewType } = useLoadConfig();
    
    // Altキーが押されているかどうかを管理するステート
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [listConfig, setListConfig] = useState<list.ListConfigResponse | null>(null);
    // リスト設定内の reloads 情報を保持するRef（固定値のためステート不要）
    // const listConfigRef = useRef<list.ListConfigResponse>();
    
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
      setSelectedIndex(headerLines);
    }, [searchQuery, listItems]);

    // 1. 全リストを「ヘッダー部分」と「検索対象のボディ部分」に分割
    const headerLines = listConfig?.headerLines ?? 0;
    const headerItems = viewType === VIEW_MODES.LIST ? listItems.slice(0, headerLines) : [];
    const bodyItems = viewType === VIEW_MODES.LIST ? listItems.slice(headerLines) : [];
    // 2. ボディ部分のみに検索クエリの絞り込みを適用
    const filteredBodyItems = filterListItems(
      bodyItems,
      searchQuery, 
      listConfig?.delimiter,
      listConfig?.withNth,
    )    
    // 3. ヘッダーと絞り込み済みのボディを常に結合したものを表示用リストとする
    const filteredListItems = [...headerItems, ...filteredBodyItems];
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

    const formConfigRef = useRef(formConfig);
    const formValuesRef = useRef(formValues);

    useEffect(() => {
      formConfigRef.current = formConfig;
      formValuesRef.current = formValues;
    }, [formConfig, formValues]);

    // コンポーネントマウント時に Go から設定を取得
    useEffect(() => {
        switch (true){ 
          case (viewType === VIEW_MODES.FORM): {
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
          } 
          break;
          case (viewType === VIEW_MODES.LIST): {
            GetListConfig()
              .then((res) =>{ 
                setListItems(res.list)
                if(res.reloads){
                  setListConfig(res)
                  // listConfigRef.current = res
                }
            }).catch((err) =>{
                    console.error("Failed to load form config:", err);
            })
          }
          break;
      }
    }, [viewType]);

    let borderValue = 0;
    let fontSizeInt = 10;
    if (viewType === VIEW_MODES.FORM && formConfig) {
      borderValue = formConfig.borders ?? 0;
      fontSizeInt = formConfig.fontSize ?? 10;
    } else if (viewType === VIEW_MODES.LIST && listConfig) {
      borderValue = listConfig.borders ?? 0;
      fontSizeInt = listConfig.fontSize ?? 10;
    }
    const fontSizePx = `${fontSizeInt}px`;
    const outputLineByExit = async(filteredListItems: string[], selectedIndex: number) => {
    const selectedItem = filteredListItems[selectedIndex];
    if (!selectedItem) return
      try {
        await WriteStdout(selectedItem);
        await ExitWithNumber(0);
      } catch (err) {
        console.error("Failed to output selected item:", err);
      }
    };

    if (viewType === VIEW_MODES.LOADING) {
      return <div className="p-8 text-center">Loading...</div>;
    }
  return (
    <div className="min-h-screen bg-white font-mono" 
      style={{ 
          fontSize: fontSizePx,
          padding: `${borderValue}px`,
        }}
    >
      <div >
      {/* <div className="max-w-md mx-auto"> */}
        {viewType === VIEW_MODES.FORM && (
          <FormComponent
            formConfig={formConfig}
            formConfigRef={formConfigRef}
            formValues={formValues}
            formValuesRef={formValuesRef}
            setFieldValue={setFieldValue}
            isAltPressed={isAltPressed}
            isAltPressedRef={isAltPressedRef}
            IsCtrlPressedRef={isCtrlPressedRef}
            borderValue={borderValue}
          />
        ) }

       {viewType === VIEW_MODES.LIST && (
          <div 
            id="list-view" 
            className="flex flex-col"
            tabIndex={0}
            onKeyDown={(e) => {
                const isAltActive = e.altKey;
                const isModifierKey = ['Alt', 'Shift', 'Control', 'Enter', 'Tab', ' '].includes(e.key);
                if (isAltActive && !isModifierKey) {
                  const pressedKey =
                    (e.code.startsWith('Key') && 
                    e.code.length === 4
                  ) ? e.code.charAt(3).toLowerCase()
                    : e.key.toLowerCase();
                  const matchedExecute = 
                    listConfig?.executes.find(
                      r => r.key.toLowerCase() === pressedKey);
                  if (matchedExecute) {
                    e.preventDefault();
                    const selectedItem = filteredListItems[selectedIndex];
                    RunCmdForList(
                      matchedExecute.shell,
                      selectedItem,
                      listConfig?.delimiter ?? "",
                    );
                    return
                  }
                  const matchedExecQuit = 
                    listConfig?.execQuits.find(
                      r => r.key.toLowerCase() === pressedKey);
                  if (matchedExecQuit) {
                    e.preventDefault();
                    const selectedItem = filteredListItems[selectedIndex];
                    RunCmdByQuitForList(
                      matchedExecQuit.shell,
                      selectedItem,
                      listConfig?.delimiter ?? "",
                      matchedExecQuit.exitCode,
                    );
                    return
                  }
                  // getListConfig で取得したデータ（またはスコープ内の変数）から直接探す
                  const matchedReload = 
                    listConfig?.reloads.find(
                      r => r.key.toLowerCase() === pressedKey);
                  if (matchedReload) {
                    e.preventDefault();
                    const selectedItem = filteredListItems[selectedIndex];
                    RunReloadCmdForList(
                      matchedReload.shell,
                      selectedItem,
                      listConfig?.delimiter ?? "",
                    ).then((res) => {
                      setListItems(res.split("\n"))
                    });
                    return
                  }
                }
              if (filteredListItems.length === 0) return;
              switch (true) {
                case (e.key === 'ArrowDown'): {
                  e.preventDefault();
                  const headerLines = listConfig?.headerLines ?? 0;
                  const isCycle = listConfig?.cycle ?? false;
                  setSelectedIndex((prev) => {
                    // ボディ部分が存在しない場合はそのまま
                    if (filteredListItems.length <= headerLines) return prev;
                    if (prev < filteredListItems.length - 1) {
                      return prev + 1;
                    } else {
                      // 一番下にいるとき
                      return isCycle ? headerLines : prev; // cycle が true なら選択可能な最初の行へ
                    }
                  })
                }
                break;
                case (e.key === 'ArrowUp'): {
                  e.preventDefault();
                  // headerLines 未満には上がらないようにする（最小でも headerLines まで）
                  const headerLines = listConfig?.headerLines ?? 0;
                  const isCycle = listConfig?.cycle ?? false;
                  
                  setSelectedIndex((prev) => {
                    // ボディ部分が存在しない場合、あるいはヘッダー行にいる場合はそのまま
                    if (filteredListItems.length <= headerLines || prev <= headerLines) {
                      return isCycle && filteredListItems.length > headerLines 
                        ? filteredListItems.length - 1 // 選択可能な一番上にいるときに上を押したら最後の行へ
                        : prev;
                    }
                    return prev - 1;
                  });
                }
                break;
                case (e.key === 'Enter'): {
                  e.preventDefault();
                  outputLineByExit(filteredListItems, selectedIndex);
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
            {listConfig?.text && (
            <h1 
              className="font-bold text-blue-900"
              style={{ 
                fontSize: "calc(1em * 110 / 100)",
                padding: "calc(1em * 110 / 100)",
              }}
              >
              {listConfig.text}
            </h1>
          )}
            <input
              ref={searchInputRef} // ★ Refを紐付け
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className=" border-b border-gray-300 rounded focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (
                  e.key === 'ArrowDown' || 
                  e.key === 'ArrowUp'
                ) {
                  e.preventDefault();
                  const bodyStartIndex = headerLines;
                  if (filteredListItems.length > bodyStartIndex) {
                    // 最初のデータ行（ボディの先頭）にフォーカスを当てる
                    setSelectedIndex(bodyStartIndex);
                    listItemRefs.current[bodyStartIndex]?.focus();
                  }
                }
              }}
              style={{ 
                padding: `${borderValue}px`,
                margin: `calc(${borderValue}px /  2)`,
              }}
            />

            {/* 絞り込み結果を表示するスクロールエリア */}
            <div className="rounded max-h-[60vh] overflow-y-auto">
              {filteredListItems.length === 0 ? (
                <p className="text-gray-500">No matching items.</p>
              ) : (
                <ul 
                  className="flex flex-col">
                  {filteredListItems.map((item, index) => {
                    const isHeader = index < headerLines;
                    const delimiter = listConfig?.delimiter ?? "" 
                    const targetField = listConfig?.withNth ?? 0
                    const fields = item.split(delimiter);
                    let displayText = item 
                    if(delimiter != "" && targetField > 0){
                     displayText = fields[targetField] !== undefined ?
                      fields[targetField] :
                       item;
                    }
                    let renderedContent: React.ReactNode = displayText;

                    if (!isHeader && searchQuery.length > 0) {
                      const lowerSQuery = searchQuery.toLowerCase();
                      const lowerDisplayText = displayText.toLowerCase();
                      
                      const matchIndices: number[] = [];
                      let curIndex = -1;
                      let isMatched = true;

                      for (const char of lowerSQuery) {
                        const charIndex = lowerDisplayText.indexOf(char, curIndex + 1);
                        if (charIndex <= curIndex || charIndex === -1) {
                          isMatched = false;
                          break;
                        }
                        matchIndices.push(charIndex);
                        curIndex = charIndex;
                      }

                      if (isMatched && matchIndices.length > 0) {
                        const parts: React.ReactNode[] = [];
                        let lastIdx = 0;

                        matchIndices.forEach((matchIdx, i) => {
                          if (matchIdx > lastIdx) {
                            parts.push(displayText.substring(lastIdx, matchIdx));
                          }
                          parts.push(
                            <strong key={i} className="font-extrabold text-blue-600 bg-blue-50">
                              {displayText.substring(matchIdx, matchIdx + 1)}
                            </strong>
                          );
                          lastIdx = matchIdx + 1;
                        });

                        if (lastIdx < displayText.length) {
                          parts.push(displayText.substring(lastIdx));
                        }

                        renderedContent = <>{parts}</>;
                      }
                    }
                    return (
                    <li 
                      key={index}
                      tabIndex={isHeader ? -1 : 0}
                      ref={(el) => (listItemRefs.current[index] = el)}
                      className="hover:bg-blue-50 focus:bg-blue-100 focus:outline-none rounded cursor-pointer border-transparent focus:border-blue-400"
                      onClick={() => {
                        if(isHeader) return
                        setSelectedIndex(index);
                        listItemRefs.current[index]?.focus();
                      }}
                      onDoubleClick={() => {
                        if(isHeader) return
                        outputLineByExit(filteredListItems, selectedIndex);
                      }}
                        style={{ 
                          padding: `${borderValue}px`,
                          margin: `calc(${borderValue}px /  2)`,
                        }}
                    >
                      {renderedContent}
                    </li>);
                  })}
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