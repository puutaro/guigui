import { form } from '../../../wailsjs/go/models';
import { SelectFile } from '../../../wailsjs/go/main/App';

export type FileSelectFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
}

export const FileSelectField = ({ 
  field, 
  fieldKey, 
  formValues, 
  setFieldValue, 
  borderValue 
}: FileSelectFieldProps) => {
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
            try {
              // Wailsのネイティブファイルダイアログを開く
              const filePath = await SelectFile(
                field.label || "Select file",
              );
              if (filePath) {
                setFieldValue(fieldKey, filePath);
              }
            } catch (err) {
              console.error("Failed to open file dialog:", err);
            }
          }}
          className="border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-sm px-3 py-1"
          style={{ padding: `${borderValue}px` }}
        >
          file...
        </button>
      </div>
    </div>
  );
};