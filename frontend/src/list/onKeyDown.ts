import { WriteStderr, RunCmdForList, RunReloadCmdForList } from "../../wailsjs/go/main/App";
import { list } from "../../wailsjs/go/models";
import ExecuteConfig = list.ExecuteConfig;
import { RunCmdAndExitForListByMinimise } from "../exit/exit";
import { outputLineByHidden } from "./libs/outputLineByHidden";

export type OnKeyDownParams = {
    e: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent;
    // e: React.KeyboardEvent<HTMLInputElement>;
    setListItems: React.Dispatch<React.SetStateAction<string[]>>;
    selectedIndex: number;
    filteredListItems: string[];
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    searchInputRef: React.RefObject<HTMLInputElement>;
    executes: ExecuteConfig[];
    execQuit: ExecuteConfig[];
    reloads: ExecuteConfig[];
    delimiter: string;
    headerLines: number;
    isCycle: boolean;
};

export const onKeyDown = (params: OnKeyDownParams) => {
    const {
        e,
        setListItems,
        selectedIndex,
        filteredListItems,
        setSelectedIndex,
        setSearchQuery,
        searchInputRef,
        executes,
        execQuit,
        reloads,
        delimiter,
        headerLines,
        isCycle,
    } = params;

    const isAltActive = e.altKey;
    const isModifierKey = ['Alt', 'Shift', 'Control', 'Tab', ' '].includes(e.key);

    // ★ 配列境界外参照を防ぐ安全な取得処理[cite: 8]
    const getSelectedItem = () => {
        if (filteredListItems.length === 0) return undefined;
        const safeIndex = Math.max(0, Math.min(selectedIndex, filteredListItems.length - 1));
        return filteredListItems[safeIndex];
    };

    if (isAltActive && !isModifierKey) {
        e.preventDefault();
        const pressedKey = (e.code.startsWith('Key') && e.code.length === 4)
            ? e.code.charAt(3).toLowerCase()
            : e.key.toLowerCase();

        const selectedItem = getSelectedItem();

        const matchedExecute =
            executes?.find(
                r => r.key.toLowerCase() === pressedKey);
        if (matchedExecute && selectedItem) {
            e.preventDefault();
            RunCmdForList(matchedExecute.shell, selectedItem, delimiter ?? "");
            return;
        }

        const matchedExecHidden =
            execQuit?.find(
                r => r.key.toLowerCase() === pressedKey);
        if (matchedExecHidden && selectedItem) {
            e.preventDefault();
            RunCmdAndExitForListByMinimise(
                matchedExecHidden.shell, selectedItem, matchedExecHidden.exitCode, delimiter, ""
            );
            return;
        }

        const matchedReload = reloads?.find(r => r.key.toLowerCase() === pressedKey);
        if (matchedReload && selectedItem) {
            e.preventDefault();
            RunReloadCmdForList(matchedReload.shell, selectedItem, delimiter ?? "").then((res) => {
                if (res != null) setListItems(res.split("\n"));
            });
            return;
        }
    }

    if (filteredListItems.length === 0) return;

    switch (true) {
        case (e.key === 'Enter'): {
            const isComposing = 'nativeEvent' in e 
                ? (e as React.KeyboardEvent).nativeEvent.isComposing 
                : (e as KeyboardEvent).isComposing;
            if (isComposing) return;
            e.preventDefault();

            const selectedItem = getSelectedItem();
            if (selectedItem) {
                setSearchQuery("");
                outputLineByHidden(selectedItem);
            }
            break;
        }
        case (e.key === 'ArrowDown'): {
            e.preventDefault();
            setSelectedIndex((prev) => {
                if (filteredListItems.length <= headerLines) return prev;
                if (prev < headerLines) return headerLines;
                if (prev < filteredListItems.length - 1) return prev + 1;
                return isCycle ? headerLines : prev;
            });
            break;
        }
        case (e.key === 'ArrowUp'): {
            e.preventDefault();
            setSelectedIndex((prev) => {
                if (filteredListItems.length <= headerLines || prev <= headerLines) {
                    return isCycle && filteredListItems.length > headerLines
                        ? filteredListItems.length - 1
                        : prev;
                }
                return prev - 1;
            });
            break;
        }
    }
};