import wailsLogo from './assets/wails.png'
import './App.css'
import { useEffect, useState, useRef } from 'react';
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
import { useUndoRedo} from './form/hooks/useAndoRedo';
import { useKeyboardShortcut} from './form/hooks/useFormKeyShortcut';
import { WriteStdout, GetFormConfig, ExitWithNumber, WriteStderr } from '../wailsjs/go/main/App';
import { form } from '../wailsjs/go/models'
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
    // ★ ステートではなく、常に最新を保持している ref から値を取得する
    const currentValues = formValuesRef.current;
    // const noReturnValueEditors = ['BTN', 'FBTN' ];
    // const noValueSignal = "NoVloEreSgIGaL"
    // let outputList: Array<string> = [];
    const outputString = fields
      .map((field, index) => {
        try {
          const label = field.label;
          // const fieldType = field.type;
          // if (noReturnValueEditors.includes(fieldType)){
          //   return noValueSignal
          // }
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
      // .filter((el) =>{
      //   if(el === noValueSignal) {
      //     return false
      //   }
      //   return true
      // })
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
          const initHandleButtonClidk = async () =>{
            await handleButtonClick(targetButton);
          }
          initHandleButtonClidk()
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
                })
                .catch((err) => {
                    console.error("Failed to load form config:", err);
                });
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