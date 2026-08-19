import { form } from '../../../wailsjs/go/models';
import { RunCmd } from '../../../wailsjs/go/main/App';

export type BtnFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
}

export const BtnField = ({ 
  field, 
  fieldKey ,
  setFieldValue,
  borderValue 
}: BtnFieldProps) => {
  return (
    <button
      type="button"
        onClick={async () => {
          try {
            await RunCmd(
              field.defaultValue,
            );
          } catch (err) {
            console.error("Failed to run cmd by btn:", err);
          }
        }}
      className="border rounded bg-gray-100 hover:bg-gray-200 text-left active:bg-gray-300"
      style={{ 
        padding: `${borderValue}px`,
        textAlign: 'center',
        }}
    >
    {field.label}
    </button>
  );
};