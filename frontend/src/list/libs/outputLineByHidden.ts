import {WriteStdoutAndExitByHidden} from "../../exit/exit";

export const outputLineByHidden =
   async(line: string) => {
       try {
           await WriteStdoutAndExitByHidden({
               ExitCode: 0,
               Stdout: line,
           })
       } catch (err) {
           console.error("Failed to output selected item:", err);
       }
   };
