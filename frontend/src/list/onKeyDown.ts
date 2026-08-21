import {RunCmdByQuitForList, RunCmdForList, RunReloadCmdForList} from "../../wailsjs/go/main/App";
import {list} from "../../wailsjs/go/models";
import ExecuteConfig = list.ExecuteConfig;

export const onKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    setListItems: React.Dispatch<React.SetStateAction<string[]>>,
    selectedIndex: number,
    filteredListItems: string[],
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>,
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>,
    searchInputRef: React.RefObject<HTMLInputElement>,
    executes: ExecuteConfig[],
    execQuit: ExecuteConfig[],
    reloads: ExecuteConfig[],
    delimiter: string,
    headerLines: number,
    isCycle: boolean,
    ) => {
    const isAltActive = e.altKey;
    const isModifierKey = ['Alt', 'Shift', 'Control', 'Enter', 'Tab', ' '].includes(e.key);
    if (isAltActive && !isModifierKey) {
        const pressedKey =
            (e.code.startsWith('Key') &&
                e.code.length === 4
            ) ? e.code.charAt(3).toLowerCase()
                : e.key.toLowerCase();
        const matchedExecute =
            executes?.find(
                r => r.key.toLowerCase() === pressedKey);
        if (matchedExecute) {
            e.preventDefault();
            const selectedItem = filteredListItems[selectedIndex];
            RunCmdForList(
                matchedExecute.shell,
                selectedItem,
                delimiter ?? "",
            );
            return
        }
        const matchedExecQuit =
            execQuit?.find(
                r => r.key.toLowerCase() === pressedKey);
        if (matchedExecQuit) {
            e.preventDefault();
            const selectedItem = filteredListItems[selectedIndex];
            RunCmdByQuitForList(
                matchedExecQuit.shell,
                selectedItem,
                delimiter ?? "",
                matchedExecQuit.exitCode,
            );
            return
        }
        // getListConfig で取得したデータ（またはスコープ内の変数）から直接探す
        const matchedReload =
            reloads?.find(
                r => r.key.toLowerCase() === pressedKey);
        if (matchedReload) {
            e.preventDefault();
            const selectedItem = filteredListItems[selectedIndex];
            RunReloadCmdForList(
                matchedReload.shell,
                selectedItem,
                delimiter ?? "",
            ).then((res) => {
                if (res == undefined) return
                setListItems(res.split("\n"));
            });
            return
        }
    }
    if (filteredListItems.length === 0) return;
    switch (true) {
        case (e.key === 'ArrowDown'): {
            e.preventDefault();
            setSelectedIndex((prev) => {
                // ボディ部分が存在しない場合はそのまま
                if (filteredListItems.length <= headerLines) return prev;
                if (document.activeElement === searchInputRef.current || prev < headerLines) {
                    return headerLines;
                }
                if (prev < filteredListItems.length - 1) {
                    return prev + 1;
                } else {
                    // 一番下にいるとき
                    return isCycle ? headerLines : prev; // cycle が true なら選択可能な最初の行へ
                }
            })
        }
            break;
        case (e.key === 'ArrowUp'): {
            e.preventDefault();
            // headerLines 未満には上がらないようにする（最小でも headerLines まで）
            setSelectedIndex((prev) => {
                // ボディ部分が存在しない場合、あるいはヘッダー行にいる場合はそのまま
                if (filteredListItems.length <= headerLines || prev <= headerLines) {
                    return isCycle && filteredListItems.length > headerLines
                        ? filteredListItems.length - 1 // 選択可能な一番上にいるときに上を押したら最後の行へ
                        : prev;
                }
                return prev - 1;
            });
        }
            break;
        case (
            (e.key.length === 1
                && !e.ctrlKey
                && !e.metaKey
                && !e.altKey) ||
            e.key === 'Backspace' ||
            e.key === 'Delete'
        ): {
            // ★ IME変換中（日本語入力の確定前など）の場合は処理しない
            if (e.nativeEvent.isComposing) return;
            // ★ リストにフォーカスがある状態で文字キーが押されたら、
            // 瞬時に検索窓にフォーカスを戻し、入力を邪魔しないようにする
            e.preventDefault();
            searchInputRef.current?.focus();
            switch (true) {
                case e.key === 'Backspace': {
                    // Backspaceの場合は検索クエリの末尾を1文字削る
                    setSearchQuery(prev => prev.slice(0, -1));
                }
                    break;
                case (e.key === 'Delete'): {
                    // Deleteの場合は必要に応じて全クリアにするか、何もしないなどをお好みで設定できます
                    // 今回はBackspaceと同様に末尾を削る動作にしておくと自然です
                    setSearchQuery(prev => prev.slice(0, -1));
                }
                    break;
                default: {
                    // 通常の文字入力
                    setSearchQuery(prev => prev + e.key);
                }
                    break;
            }
        }
            break;
    }
}