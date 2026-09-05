import {WriteStdoutAndExitByHidden} from "../../exit/exit";
import { KeepConfig } from "../../type/keepInfo";

export const outputLineByHidden =
   async(
    line: string,
    keepConfig: KeepConfig,
) => {
       try {
           await WriteStdoutAndExitByHidden(
               line,
               0,
               keepConfig,
           )
       } catch (err) {
           console.error("Failed to output selected item:", err);
       }
   };
