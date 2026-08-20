import { form } from '../../wailsjs/go/models';
import { useEffect, useRef } from 'react';
import { DirSelectField } from '../form/editor/dirSelectField';
import { FileSelectField } from '../form/editor/fileSelectField';
import { NumEditField } from '../form/editor/numEditField';
import { BtnField } from '../form/editor/btnField';
import { BottomButton } from '../form/bottomButton/bottomButton';
import { handleButtonClick } from './handleBottonClick';

// 親から受け取るpropsの型定義
export type FormComponentProps = {
  formConfig: form.FormConfigResponse | null;
  formConfigRef: React.MutableRefObject<form.FormConfigResponse | null>;
  formValues: Record<string, string>;
  formValuesRef: React.MutableRefObject<Record<string, string>>,
  setFieldValue: (key: string, value: string) => void;
  isAltPressed: boolean;
  isAltPressedRef: React.MutableRefObject<boolean>;
  IsCtrlPressedRef: React.MutableRefObject<boolean>;
  borderValue: number;
}

export const  FormComponent = ({
  formConfig,
  formConfigRef,
  formValues,
  formValuesRef,
  setFieldValue,
  isAltPressed ,
  isAltPressedRef,
  IsCtrlPressedRef,
   borderValue,
  }: FormComponentProps
) => {
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
              const isCtrlActive = e.ctrlKey || IsCtrlPressedRef.current;
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