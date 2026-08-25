import {WriteStdoutAndExitByHidden} from "../../exit/exit";

export const outputLineByHidden =
   async(line: string) => {
       try {
           await WriteStdoutAndExitByHidden(
               line,
               0,
           )
       } catch (err) {
           console.error("Failed to output selected item:", err);
       }
   };
