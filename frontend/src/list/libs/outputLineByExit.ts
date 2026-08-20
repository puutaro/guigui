import {
    WriteStdout, ExitWithNumber,
} from '../../../wailsjs/go/main/App';

export const outputLineByExit =
   async(filteredListItems: string[], selectedIndex: number) => {
       const selectedItem = filteredListItems[selectedIndex];
       if (!selectedItem) return
       try {
           await WriteStdout(selectedItem);
           await ExitWithNumber(0);
       } catch (err) {
           console.error("Failed to output selected item:", err);
       }
   };
