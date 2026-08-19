import { form } from '../../wailsjs/go/models';
import { DirSelectField } from '../form/editor/dirSelectField';
import { FileSelectField } from '../form/editor/fileSelectField';
import { NumEditField } from '../form/editor/numEditField';
import { BtnField } from '../form/editor/btnField';
import { BottomButton } from '../form/bottomButton/bottomButton';

// 親から受け取るpropsの型定義
export type FormComponentProps = {
  formConfig: form.FormConfigResponse | null;
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  handleButtonClick: (btn: form.ButtonDef) => Promise<void>;
  isAltPressed: boolean;
  borderValue: number;
}

export const  FormComponent = ({
  formConfig,
  formValues,
  setFieldValue,
  handleButtonClick,
  isAltPressed ,
   borderValue,
  }: FormComponentProps
) => {
    return (
        (
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
                  isAltPressed={isAltPressed}
                  handleButtonClick={handleButtonClick}
                />
            </div>
          )}
          </div>
        )
    )
}