import {
    ExitWith252,
    ExitWithNumber,
    GetActiveMode,
    RunCmdAndExitForList,
    WriteStdoutByHidden
} from '../../wailsjs/go/main/App';
import {network} from "../../wailsjs/go/models";

export const Exit252ByMinimise = () => {
    (window as any).runtime.WindowMinimise();
    (async () => {
        await ExitWith252()
    })()
}

export const RunCmdAndExitForListByMinimise = (
    shell: string,
    selectedItem: string,
    exitCode: number,
    delimiter: string,
) => {
    (window as any).runtime.WindowMinimise();
    RunCmdAndExitForList(
        shell,
        selectedItem,
        delimiter ?? "",
        {
            ExitCode: exitCode,
            Stdout: "",
        },
    );
}

export const WriteStdoutAndExitByHidden = async (
   res: network.GuiResponse
) => {
    (window as any).runtime.WindowMinimise();
    await WriteStdoutByHidden(res);
}
export const ExitByHidden = async (exitCode: number) => {
    (window as any).runtime.WindowMinimise();
    await ExitWithNumber(exitCode);
}
