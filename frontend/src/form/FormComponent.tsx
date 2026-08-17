import { form } from '../../wailsjs/go/models';

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
                          fontSize: "1em",
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
        )
    )
}