import { WriteStderr, RunCmdForList, RunReloadCmdForList } from "../../wailsjs/go/main/App";
import { list } from "../../wailsjs/go/models";
import ExecuteConfig = list.ExecuteConfig;
import { RunCmdAndExitForListByMinimise } from "../exit/exit";
import { outputLineByHidden } from "./libs/outputLineByHidden";
import { KeepConfig } from "../type/keepInfo";

export type OnKeyDownParams = {
    e: React.KeyboardEvent<HTMLInputElement>;
    setListItems: React.Dispatch<React.SetStateAction<string[]>>;
    selectedIndex: number;
    filteredListItems: string[];
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    searchInputRef: React.RefObject<HTMLInputElement>;
    executes: ExecuteConfig[];
    execQuit: ExecuteConfig[];
    reloads: ExecuteConfig[];
    delimiter: string;
    headerLines: number;
    isCycle: boolean;
    keepConfig: KeepConfig;
    isComposingRef: React.MutableRefObject<boolean>;
    lastCommittedRef: React.MutableRefObject<string>;
    justEndedComposingRef: React.MutableRefObject<boolean>;
};

export const onKeyDown = (params: OnKeyDownParams) => {
    const {
        e,
        setListItems,
        selectedIndex,
        filteredListItems,
        setSelectedIndex,
        searchQuery,
        setSearchQuery,
        searchInputRef,
        executes,
        execQuit,
        reloads,
        delimiter,
        headerLines,
        isCycle,
        keepConfig,
        isComposingRef,
        lastCommittedRef,
        justEndedComposingRef,
    } = params;

    const isComposing = isComposingRef?.current || e.nativeEvent.isComposing;
    const isJustEnded = justEndedComposingRef?.current;

    // 1. IME変換中の Esc ガード
    if (e.key === 'Escape' && isComposing) {
        e.stopPropagation();
        e.preventDefault();
        if (isComposingRef) isComposingRef.current = false;
        return;
    }

    // 2. IME変換中、または IME確定用に押された Enter のガード（ホスト実行をブロック）
    if (isComposing || isJustEnded) {
        if (e.key === 'Enter') {
            e.stopPropagation();
            if (justEndedComposingRef) justEndedComposingRef.current = false;
        }
        return; 
    }

    // ★ 3. Backspace 押下時のフォーカス誤作動・親伝播ガード
    if (e.key === 'Backspace') {
        e.stopPropagation();
        if (searchQuery === "") {
            e.preventDefault();
        }
        return;
    }

    const isAltActive = e.altKey;
    const isModifierKeyOnly = ['Alt', 'Shift', 'Control', 'Meta', 'Tab'].includes(e.key);

    const getSelectedItem = () => {
        if (filteredListItems.length === 0) return undefined;
        const safeIndex = Math.max(0, Math.min(selectedIndex, filteredListItems.length - 1));
        return filteredListItems[safeIndex];
    };

    // ★ 4. Mac Option(Alt) キー押し込みによる特殊文字（å等）出力防止 & ショートカット処理
    if (isAltActive && !isModifierKeyOnly) {
        e.preventDefault(); // ★ 入力欄への特殊文字出力を即座にカット
        const pressedKey = (e.code.startsWith('Key') && e.code.length === 4)
            ? e.code.charAt(3).toLowerCase()
            : e.key.toLowerCase();

        const selectedItem = getSelectedItem();

        const matchedExecute = executes?.find(r => r.key.toLowerCase() === pressedKey);
        if (matchedExecute && selectedItem) {
            RunCmdForList(matchedExecute.shell, selectedItem, delimiter ?? "");
            return;
        }

        const matchedExecHidden = execQuit?.find(r => r.key.toLowerCase() === pressedKey);
        if (matchedExecHidden && selectedItem) {
            RunCmdAndExitForListByMinimise(
                matchedExecHidden.shell, 
                selectedItem, 
                matchedExecHidden.exitCode, 
                delimiter, 
                "",
                keepConfig,
            );
            return;
        }

        const matchedReload = reloads?.find(r => r.key.toLowerCase() === pressedKey);
        if (matchedReload && selectedItem) {
            RunReloadCmdForList(matchedReload.shell, selectedItem, delimiter ?? "").then((res) => {
                if (res != null) setListItems(res.split("\n"));
            });
            return;
        }
    }

    if (filteredListItems.length === 0) return;

    // ★ 5. 通常時の Enter / ArrowDown / ArrowUp 処理
    switch (e.key) {
        case 'Enter': {
            e.preventDefault();

            const selectedItem = getSelectedItem();
            if (selectedItem) {
                setSearchQuery("");
                outputLineByHidden(
                    selectedItem,
                    keepConfig,
                );
            }
            break;
        }
        case 'ArrowDown': {
            e.preventDefault();
            setSelectedIndex((prev) => {
                if (filteredListItems.length <= headerLines) return prev;
                if (prev < headerLines) return headerLines;
                if (prev < filteredListItems.length - 1) return prev + 1;
                return isCycle ? headerLines : prev;
            });
            break;
        }
        case 'ArrowUp': {
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