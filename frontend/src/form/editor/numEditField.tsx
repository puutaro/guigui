import { form } from '../../../wailsjs/go/models';

export type NumSelectFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
}
export const NumEditField = ({ 
  field, 
  fieldKey, 
  formValues, 
  setFieldValue, 
  borderValue 
}: NumSelectFieldProps) => {
  const numSeparator = '!';
  const parts = (field.srcValue || "").split(numSeparator);
  const rangePart = parts[1] || "";
  const stepVal = parts[2] ? parseFloat(parts[2]) : 1;
  const decimals = parts[2] && parts[2].includes('.') ? parts[2].split('.')[1].length : 0;

  const [minStr, maxStr] = rangePart.split('..');
  const minVal = minStr ? parseFloat(minStr) : undefined;
  const maxVal = maxStr ? parseFloat(maxStr) : undefined;

  const curValueEntry = formValues[fieldKey]
  const currentValue = curValueEntry !== undefined ? curValueEntry.split(numSeparator)[0] : field.defaultValue;

  const handleStep = (direction: number) => {
    const currentNum = parseFloat(currentValue.toString()) || 0;
    let nextNum = currentNum + direction * stepVal;
    if (minVal !== undefined && nextNum < minVal) nextNum = minVal;
    if (maxVal !== undefined && nextNum > maxVal) nextNum = maxVal;
    setFieldValue(fieldKey, nextNum.toFixed(decimals));
  };
  return (
    <div className="flex items-center">
      <input 
        type="number"
        step={stepVal}
        min={minVal}
        max={maxVal}
        value={currentValue}
        onChange={(e) => setFieldValue(fieldKey, e.target.value)}
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
};