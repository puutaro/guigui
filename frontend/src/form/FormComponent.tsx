import { form } from '../../wailsjs/go/models';
import { useEffect, useState, useRef } from 'react';
import { DirSelectField } from '../form/editor/dirSelectField';
import { FileSelectField } from '../form/editor/fileSelectField';
import { NumEditField } from '../form/editor/numEditField';
import { BtnField } from '../form/editor/btnField';
import { BottomButton } from '../form/bottomButton/bottomButton';
import { handleButtonClick } from './handleBottonClick';
import { useUndoRedo} from './hooks/useAndoRedo';
import { useKeyboardShortcut} from './hooks/useFormKeyShortcut';


// 親から受け取るpropsの型定義
export type FormComponentProps = {
  formConfig: form.FormConfigResponse | null;
  borderValue: number;
}

export const  FormComponent = ({
  formConfig,
   borderValue,
  }: FormComponentProps
) => {

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
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key){
                case 'Alt':
                    isAltPressedRef.current = true;
                    setIsAltPressed(true);
                    break;
                case 'Control':
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
                case 'Control':
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

    const firstFieldRef = useRef<HTMLDivElement | null>(null);
    const hasFocusedRef = useRef(false); // ★ 初回実行済みフラグ
    // フォームが最初に描画されたときの1回だけ実行
    useEffect(() => {
    if (!formConfig || hasFocusedRef.current) return;
    const timer = setTimeout(() => {
      hasFocusedRef.current = true; // フラグを立てて2回目以降をブロック
      const target = firstFieldRef.current?.querySelector('input, select, button, [tabindex="0"]') as HTMLElement;
      target?.focus();
      if (target instanceof HTMLInputElement) {
         target.select();
      }
    }, 100);
    return () => clearTimeout(timer);
    }, [formConfig]);

    // 取得したデフォルト値を初期値としてフォームの値ステートにセットする
    const initialValues: Record<string, string> = {};
    formConfig?.fields.forEach((field, index) => {
        const key =  `${index}_${field.label}`;
        initialValues[key] = field.defaultValue || "";
    });
    useEffect(() => {
        setFormValues(initialValues);
    }, []);

    const firstFocusableIndex = formConfig?.fields.findIndex(field => 'LBL' != field.type) ?? -1;
    const isExecutingRef = useRef(false);
    return (
        (
          <div 
            id="form-view" 
            className="flex flex-col h-[calc(100vh-4rem)]"
            onKeyDown={(e) => {
              const isAltActive = e.altKey || isAltPressedRef.current;
              const isModifierKey = ['Alt', 'Shift', 'Control', 'Enter', 'Tab', ' '].includes(e.key);
              const currentConfig = formConfigRef.current;
              if (!currentConfig?.buttons) return;

              // 1. Alt / Option ショートカットの判定（ボタン用）
              if (isAltActive && !isModifierKey && e.code.startsWith('Key')) {
                const pressedKey = e.code.replace('Key', '').toLowerCase();

                const targetButton = currentConfig.buttons.find(btn => {
                  if (!btn.label || btn.label.length === 0) return false;
                  return btn.label.charAt(0).toLowerCase() === pressedKey;
                });

                if (targetButton) {
                  e.preventDefault();
                  handleButtonClick(
                      formConfigRef,
                      targetButton,
                      formValuesRef,
                      isExecutingRef,
                  );
                  return;
                }
              }
              // 2. Ctrl + Enter ショートカットの判定
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
                  handleButtonClick(
                      formConfigRef,
                      targetButton,
                      formValuesRef,
                      isExecutingRef,
                  );
                }
              }
            }
          }
          >
            {formConfig?.text && (
            <h1 
              className="font-bold text-blue-900 flex-shrink-0"
              style={{ 
                fontSize: "calc(1em * 110 / 100)",
                padding: "calc(1em * 110 / 100)",
              }}
              >
              {formConfig?.text ?? ""}
            </h1>
            )}
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
                  const isFirstTarget = index === firstFocusableIndex; // 最初のエレメントか判定
                  let labelDisplayValue = 'inline';
                  const btnList = ['BTN', 'FBTN'] as const
                  const labelHIddenList = ['LBL', ...btnList]
                  switch (true) {
                  case (labelHIddenList  as readonly string[]).includes(field.type):{
                    labelDisplayValue = 'none';
                    break;
                  }
                  }
                  return (
                    <div 
                      ref={isFirstTarget ? firstFieldRef : undefined}
                      key={index} 
                      className="flex flex-col"
                      style={{ paddingBottom: `${borderValue}px` }}
                    >
                      {/* (フィールドの描画ロジックはそのまま) */}
                      <label 
                        className="font-bold mb-1"
                        style={{ 
                          display: `${labelDisplayValue}`,
                          fontSize: "calc(1em * 3 / 4)",
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
                      {(btnList  as readonly string[]).includes(field.type) && (
                        <BtnField 
                          field={field}
                          fieldKey={key}
                          setFieldValue={setFieldValue}
                          borderValue={borderValue}
                         />
                      )}
                      {['DIR', 'MDIR', 'CDIR'].includes(field.type) && (
                        <DirSelectField 
                          field={field}
                          fieldKey={key}
                          formValues={formValues}
                          setFieldValue={setFieldValue}
                          borderValue={borderValue}
                         />
                      )}
                      {['FL', 'MFL', 'SFL'].includes(field.type) && (
                        <FileSelectField 
                          field={field}
                          fieldKey={key}
                          formValues={formValues}
                          setFieldValue={setFieldValue}
                          borderValue={borderValue}
                         />
                      )}
                      {field.type === 'LBL' && (
                        <span 
                          className="text-gray-600 block whitespace-pre-wrap"
                          style={{ padding: `${borderValue}px` }}
                        >
                          {field.label}
                        </span>
                      )}
                      {field.type === 'NUM' && (
                        <NumEditField 
                          field={field}
                          fieldKey={key}
                          formValues={formValues}
                          setFieldValue={setFieldValue}
                          borderValue={borderValue}
                         />
                      )}
                  </div>
                );
              })}
            </div>
              <BottomButton 
                  borderValue={borderValue}
                  formConfig={formConfig}
                  formConfigRef={formConfigRef}
                  formValuesRef={formValuesRef}
                  isAltPressed={isAltPressed}
                  isExecutingRef={isExecutingRef}
                  handleButtonClick={handleButtonClick}
                />
            </div>
          )}
          </div>
        )
    )
}