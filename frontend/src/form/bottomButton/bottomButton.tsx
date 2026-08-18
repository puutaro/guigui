import { form } from '../../../wailsjs/go/models';

export type BottomButtonProps = {
  borderValue: number;
  formConfig: form.FormConfigResponse;
  isAltPressed: boolean;
  handleButtonClick: (btn: form.ButtonDef) => Promise<void>;
}

export const BottomButton = ({ 
  borderValue,
  formConfig,
  isAltPressed,
  handleButtonClick,
}: BottomButtonProps) => {
  return (
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
  );
};