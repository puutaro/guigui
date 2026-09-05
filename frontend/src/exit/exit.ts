import {
    ExitWith252,
    ExitWithNumber,
    RunCmdAndExitForList,
    WriteStdoutByHidden,
    MinimizeGui,
} from '../../wailsjs/go/main/App';
import { KeepConfig } from '../type/keepInfo';

export const Exit252ByMinimise = (keepConfig: KeepConfig, eventName: string) => {
    (async () => {
        if (
            !keepConfig.isKeep 
            || keepConfig.keepExcludes.includes(eventName)
        ){
            await MinimizeGui()
        }
        await ExitWith252()
    })()
}

export const RunCmdAndExitForListByMinimise = (
    shell: string,
    selectedItem: string,
    exitCode: number,
    delimiter: string,
    stdout: string,
    keepConfig: KeepConfig,
) => {
    // (window as any).runtime.WindowMinimise();
    (async () => {
        if (!keepConfig.isKeep){
            await MinimizeGui()
        }
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
  keepConfig: KeepConfig,
) => {
    if (!keepConfig.isKeep){
        (window as any).runtime.WindowMinimise();
        await MinimizeGui()
    }
    await WriteStdoutByHidden(
        stdout,
        exitCode,
    );
}
export const ExitByHidden = async (
    exitCode: number,
    keepConfig: KeepConfig,
) => {
    if (!keepConfig.isKeep){
        await MinimizeGui()
    }
    await ExitWithNumber(exitCode);
}
