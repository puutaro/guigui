import { form } from '../../../wailsjs/go/models';
import { SelectDir } from '../../../wailsjs/go/main/App';

export type DirSelectFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
}

export const DirSelectField = ({ 
  field, 
  fieldKey, 
  formValues, 
  setFieldValue, 
  borderValue 
}: DirSelectFieldProps) => {
  return (
    <div className="flex flex-col" style={{ paddingBottom: `${borderValue}px` }}>
      <div className="flex items-center space-x-2">
        <input 
          type="text" 
          value={formValues[fieldKey] ?? field.defaultValue ?? ""} 
          onChange={(e) => setFieldValue(fieldKey, e.target.value)}
          className="border rounded flex-1 bg-gray-50"
          style={{ padding: `${borderValue}px` }}
        />
        <button
          type="button"
          onClick={async () => {
            const filePath = await SelectDir(field.label || "Select Dir");
            if (filePath) setFieldValue(fieldKey, filePath);
          }}
          className="border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-sm px-3 py-1"
          style={{ padding: `${borderValue}px` }}
        >
          dir...
        </button>
      </div>
    </div>
  );
};