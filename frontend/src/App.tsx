import wailsLogo from './assets/wails.png'
import './App.css'
import { useEffect, useState, useRef } from 'react';
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
import { useUndoRedo} from './form/hooks/useAndoRedo';
import { useKeyboardShortcut} from './form/hooks/useFormKeyShortcut';
import { 
  GetFormConfig,
  GetListConfig, 
 } from '../wailsjs/go/main/App';
import { form, list } from '../wailsjs/go/models'
import { FormComponent } from './form/FormComponent';
import { ListComponent } from './list/ListComponent';

function App() {
    useEscClose()
    const { viewType, setViewType } = useLoadConfig();
    
    // Altキーが押されているかどうかを管理するステート
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [listConfig, setListConfig] = useState<list.ListConfigResponse | null>(null);
    // リスト設定内の reloads 情報を保持するRef（固定値のためステート不要）

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
           <ListComponent
               listConfig={listConfig}
               listItems={listItems}
               setListItems={setListItems}
               selectedIndex={selectedIndex}
               setSelectedIndex={setSelectedIndex}
               searchQuery={searchQuery}
               setSearchQuery={setSearchQuery}
               searchInputRef={searchInputRef}
               borderValue={borderValue}
           />
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