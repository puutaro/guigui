import {
    WriteStdout, ExitWithNumber,
} from '../../../wailsjs/go/main/App';

export const outputLineByExit =
   async(line: string) => {
       try {
           await WriteStdout(line);
           await ExitWithNumber(0);
       } catch (err) {
           console.error("Failed to output selected item:", err);
       }
   };
