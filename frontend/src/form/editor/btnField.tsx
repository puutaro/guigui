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
      className="border rounded bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-left "
      style={{ 
        padding: `${borderValue}px`,
        textAlign: 'center',
        }}
    >
    {field.label}
    </button>
  );
};