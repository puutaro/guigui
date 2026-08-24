import {
    ExitWithNumber, WriteStdoutByHidden,
} from '../../../wailsjs/go/main/App';

export const outputLineByHidden =
   async(line: string) => {
       try {
           await WriteStdoutByHidden({
               ExitCode: 0,
               DownGui: false,
               Stdout: line,
           });
           // await ExitWithNumber(0);
       } catch (err) {
           console.error("Failed to output selected item:", err);
       }
   };
