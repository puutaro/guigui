import {
    ExitWith252,
    ExitWithNumber,
    RunCmdAndExitForList,
    WriteStdoutByHidden,
    MinimizeGui,
} from '../../wailsjs/go/main/App';
import {network} from "../../wailsjs/go/models";

export const Exit252ByMinimise = () => {
    // (window as any).runtime.WindowMinimise();
    (async () => {
        await MinimizeGui()
        await ExitWith252()
    })()
}

export const RunCmdAndExitForListByMinimise = (
    shell: string,
    selectedItem: string,
    exitCode: number,
    delimiter: string,
    stdout: string,
) => {
    // (window as any).runtime.WindowMinimise();
    (async () => {
        await MinimizeGui()
        await RunCmdAndExitForList(
            shell,
            selectedItem,
            delimiter ?? "",
            exitCode,
            stdout,
        );
    })()
}

export const WriteStdoutAndExitByHidden = async (
  stdout: string,
  exitCode: number,
) => {
    (window as any).runtime.WindowMinimise();
    await MinimizeGui()
    await WriteStdoutByHidden(
        stdout,
        exitCode,
    );
}
export const ExitByHidden = async (exitCode: number) => {
    // (window as any).runtime.WindowMinimise();
    await MinimizeGui()
    await ExitWithNumber(exitCode);
}
