import { form } from '../../wailsjs/go/models';
import {
    ExitWithNumber,
} from '../../wailsjs/go/main/App';
import {ExitByHidden, WriteStdoutAndExitByHidden} from "../exit/exit";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));


export const handleButtonClick = async (
    formConfigRef: React.MutableRefObject<form.FormConfigResponse | null>,
    btn: form.ButtonDef,
    formValuesRef: React.MutableRefObject<Record<string, string>>,
    isExecutingRef: React.MutableRefObject<boolean>,
): Promise<void> => {
    if (isExecutingRef.current) {
      return;
    }
    isExecutingRef.current = true;
    if (btn.exitCode == 1){
      await ExitByHidden(btn.exitCode);
      return
    }
    
    let currentConfig = formConfigRef.current;
    let fields = currentConfig?.fields || [];
    let retries = 0;
    while (fields.length === 0 && retries < 5) {
      await sleep(10);
      console.log(`retry :${retries}`)
      currentConfig = formConfigRef.current;
      fields = currentConfig?.fields || [];
      retries++;
    }
    const separator = currentConfig?.separator || "!";
    const currentValues = formValuesRef.current;
    const outputString = fields
      .map((field, index) => {
        try {
          const label = field.label;
          const key = `${index}_${label}`;
          return currentValues[key] ?? field.defaultValue ?? "";
        } catch (err: any) {
          // どこで、何というエラーで落ちたかを確実にファイルや標準出力に吐かせる
          console.log(`Excenption at index ${index}: ${err?.message || err}`);
          return "";
        }
      })
      .join(separator);
    isExecutingRef.current = false;
    await WriteStdoutAndExitByHidden(
        outputString,
        btn.exitCode,
    );
  };
